'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase';
import { setSession, clearSession } from '@/lib/auth';

// Authentication actions
export async function signUpAction(name: string, email: string, password: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user with this name or email already exists
    const { data: existingUserByName, error: nameCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle();

    if (nameCheckError) {
      console.error('Error checking existing user by name:', nameCheckError);
      // If the error is about missing column, the migration hasn't been run
      if (nameCheckError.message?.includes('column') || nameCheckError.code === '42703') {
        return { success: false, error: 'Database migration not applied. Please contact support.' };
      }
    }

    if (existingUserByName) {
      return { success: false, error: 'A user with this name already exists. Please choose a different name.' };
    }

    const { data: existingUserByEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (emailCheckError) {
      console.error('Error checking existing user by email:', emailCheckError);
      // If the error is about missing column, the migration hasn't been run
      if (emailCheckError.message?.includes('column') || emailCheckError.code === '42703') {
        return { success: false, error: 'Database migration not applied. Please contact support.' };
      }
    }

    if (existingUserByEmail) {
      return { success: false, error: 'A user with this email already exists. Please use a different email or sign in.' };
    }

    // Hash password
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (bcryptError: any) {
      console.error('Error hashing password:', bcryptError);
      return { success: false, error: 'Failed to process password. Please try again.' };
    }

    // Create new user record with default balance of 200 fitcoins
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        balance: 200,
        is_admin: false,
        goals_set: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      // Handle database constraint errors
      if (createError.code === '23505') { // Unique violation error code
        if (createError.message.includes('email')) {
          return { success: false, error: 'A user with this email already exists. Please use a different email or sign in.' };
        }
        return { success: false, error: 'A user with this name already exists. Please choose a different name.' };
      }
      // Check if columns don't exist (migration not run)
      if (createError.message?.includes('column') || createError.code === '42703') {
        return { success: false, error: 'Database migration not applied. The email and password_hash columns are missing. Please contact support.' };
      }
      return { success: false, error: createError.message || 'Failed to create user' };
    }

    if (!newUser) {
      return { success: false, error: 'Failed to create user' };
    }

    // Set session immediately (no email verification needed)
    try {
      await setSession(newUser.id);
    } catch (sessionError: any) {
      console.error('Error setting session:', sessionError);
      // User was created but session failed - still return success but log the error
      // The user can log in manually
    }

    revalidatePath('/');
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Unexpected error in signUpAction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}

export async function signInAction(email: string, password: string) {
  const supabase = await createServerSupabaseClient();
  
  // Find user by email
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (fetchError || !user) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Check if user has a password hash (for existing users who might not have one yet)
  if (!user.password_hash) {
    return { success: false, error: 'Account not set up. Please contact support.' };
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Set session
  await setSession(user.id);

  revalidatePath('/');
  return { success: true, user };
}

export async function signOutAction() {
  await clearSession();
  revalidatePath('/');
  return { success: true };
}

export async function forgotPasswordAction(email: string) {
  const supabase = await createServerSupabaseClient();
  
  // Find user by email
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  // Don't reveal if email exists or not (security best practice)
  if (fetchError || !user) {
    // Still return success to prevent email enumeration
    return { success: true };
  }

  // Generate secure reset token
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpires = new Date();
  resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiration

  // Store reset token in database
  const { error: updateError } = await supabase
    .from('users')
    .update({
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires.toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: 'Failed to generate reset token. Please try again.' };
  }

  // TODO: Send email with reset link
  // For now, we'll just return success
  // The reset link would be: ${baseUrl}/reset-password?token=${resetToken}
  
  return { success: true };
}

export async function resetPasswordAction(token: string, newPassword: string) {
  const supabase = await createServerSupabaseClient();
  
  // Find user by reset token
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, reset_token_expires')
    .eq('reset_token', token)
    .single();

  if (fetchError || !user) {
    return { success: false, error: 'Invalid or expired reset token' };
  }

  // Check if token is expired
  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return { success: false, error: 'Reset token has expired. Please request a new one.' };
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires: null,
    })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }

  return { success: true };
}

export async function createChallengeAction(
  userId: string,
  dexaGoal: string,
  functionalGoal: string
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user already has a challenge
    const { data: existingChallenge, error: checkError } = await supabase
      .from('challenges')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing challenge:', checkError);
      return { success: false, error: 'Failed to check for existing challenge. Please try again.' };
    }

    if (existingChallenge) {
      return { success: false, error: 'Challenge already exists for this user' };
    }

    // Create challenge
    const { error: insertError } = await supabase.from('challenges').insert({
      user_id: userId,
      dexa_goal: dexaGoal,
      functional_goal: functionalGoal,
    });

    if (insertError) {
      console.error('Error creating challenge:', insertError);
      return { success: false, error: insertError.message || 'Failed to create challenge. Please try again.' };
    }

    // Give user 200 fitcoins (entry fee)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return { success: false, error: 'User not found. Please try again.' };
    }

    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance + 200, goals_set: true })
      .eq('id', userId);

    if (balanceError) {
      console.error('Error updating user balance:', balanceError);
      return { success: false, error: 'Failed to update balance. Please try again.' };
    }

    // Add 20 euros to system total (200 fitcoins = 20 euros at 10 fitcoins/euro)
    const { data: systemSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'total_euros_in_system')
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching system settings:', settingsError);
      return { success: false, error: 'Failed to update system settings. Please try again.' };
    }

    if (systemSettings) {
      const newTotal = Number(systemSettings.value) + 20;
      const { error: systemError } = await supabase
        .from('system_settings')
        .update({ value: newTotal })
        .eq('key', 'total_euros_in_system');

      if (systemError) {
        console.error('Error updating system settings:', systemError);
        return { success: false, error: 'Failed to update system settings. Please try again.' };
      }
    } else {
      // Initialize if it doesn't exist
      const { error: initError } = await supabase
        .from('system_settings')
        .insert({ key: 'total_euros_in_system', value: 20 });

      if (initError) {
        console.error('Error initializing system settings:', initError);
        return { success: false, error: 'Failed to initialize system settings. Please try again.' };
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in createChallengeAction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}

export async function createWagerAction(
  creatorId: string,
  targetUserId: string,
  challengeType: 'DEXA' | 'FUNCTIONAL',
  prediction: 'PASS' | 'FAIL',
  amount: number
) {
  const supabase = await createServerSupabaseClient();
  
  // Deduct from creator
  const { data: creator } = await supabase
    .from('users')
    .select('balance')
    .eq('id', creatorId)
    .single();

  if (!creator || creator.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const { error: deductError } = await supabase
    .from('users')
    .update({ balance: creator.balance - amount })
    .eq('id', creatorId);

  if (deductError) throw deductError;

  // Create wager
  const { error: wagerError } = await supabase.from('wagers').insert({
    creator_id: creatorId,
    target_user_id: targetUserId,
    challenge_type: challengeType,
    prediction,
    amount,
    status: 'OPEN',
  });

  if (wagerError) throw wagerError;

  revalidatePath('/dashboard');
}

export async function counterWagerAction(wagerId: string, counterId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Get wager details
  const { data: wager, error: wagerFetchError } = await supabase
    .from('wagers')
    .select('amount, creator_id, status')
    .eq('id', wagerId)
    .single();

  if (wagerFetchError || !wager) throw wagerFetchError || new Error('Wager not found');
  if (wager.status !== 'OPEN') throw new Error('Wager is not open');
  if (wager.creator_id === counterId) throw new Error('Cannot counter your own wager');

  // Check counter balance
  const { data: counter } = await supabase
    .from('users')
    .select('balance')
    .eq('id', counterId)
    .single();

  if (!counter || counter.balance < wager.amount) {
    throw new Error('Insufficient balance');
  }

  // Deduct from counter
  const { error: deductError } = await supabase
    .from('users')
    .update({ balance: counter.balance - wager.amount })
    .eq('id', counterId);

  if (deductError) throw deductError;

  // Update wager
  const { error: updateError } = await supabase
    .from('wagers')
    .update({
      counter_id: counterId,
      status: 'MATCHED',
    })
    .eq('id', wagerId);

  if (updateError) throw updateError;

  revalidatePath('/dashboard');
}

export async function cancelWagerAction(wagerId: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: wager, error: wagerFetchError } = await supabase
    .from('wagers')
    .select('amount, creator_id, status')
    .eq('id', wagerId)
    .single();

  if (wagerFetchError || !wager) throw wagerFetchError || new Error('Wager not found');
  if (wager.creator_id !== userId) throw new Error('Only creator can cancel');
  if (wager.status !== 'OPEN') throw new Error('Only open wagers can be cancelled');

  // Refund creator
  const { data: creator } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();

  if (creator) {
    const { error: refundError } = await supabase
      .from('users')
      .update({ balance: creator.balance + wager.amount })
      .eq('id', userId);

    if (refundError) throw refundError;
  }

  // Cancel wager
  const { error: cancelError } = await supabase
    .from('wagers')
    .update({ status: 'CANCELLED' })
    .eq('id', wagerId);

  if (cancelError) throw cancelError;

  revalidatePath('/dashboard');
}

export async function resolveChallengeAction(
  userId: string,
  challengeType: 'DEXA' | 'FUNCTIONAL',
  status: 'PASSED' | 'FAILED'
) {
  const supabase = await createServerSupabaseClient();
  
  // Update challenge status
  const updateField = challengeType === 'DEXA' ? 'dexa_status' : 'functional_status';
  const { error: challengeError } = await supabase
    .from('challenges')
    .update({ [updateField]: status })
    .eq('user_id', userId);

  if (challengeError) throw challengeError;

  // Find all matched wagers for this user/challenge type
  const { data: wagers, error: wagersError } = await supabase
    .from('wagers')
    .select('*')
    .eq('target_user_id', userId)
    .eq('challenge_type', challengeType)
    .eq('status', 'MATCHED');

  if (wagersError) throw wagersError;

  // Settle each wager
  for (const wager of wagers || []) {
    const predictedPass = wager.prediction === 'PASS';
    const actualPass = status === 'PASSED';
    const winnerId = predictedPass === actualPass ? wager.creator_id : wager.counter_id!;

    // Award pot (2x amount) to winner
    const { data: winner } = await supabase
      .from('users')
      .select('balance')
      .eq('id', winnerId)
      .single();

    if (winner) {
      const pot = wager.amount * 2;
      const { error: awardError } = await supabase
        .from('users')
        .update({ balance: winner.balance + pot })
        .eq('id', winnerId);

      if (awardError) throw awardError;
    }

    // Mark wager as settled
    const { error: settleError } = await supabase
      .from('wagers')
      .update({
        status: 'SETTLED',
        winner_id: winnerId,
      })
      .eq('id', wager.id);

    if (settleError) throw settleError;
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
}

export async function approveFundRequestAction(
  requestId: string,
  adminId: string
) {
  const supabase = await createServerSupabaseClient();
  
  // Verify admin
  const { data: admin } = await supabase
    .from('users')
    .select('is_admin, name')
    .eq('id', adminId)
    .single();

  if (!admin || !admin.is_admin || admin.name !== 'Bart-Jan Decroos') {
    throw new Error('Unauthorized: Only admin can approve fund requests');
  }

  // Get fund request
  const { data: request, error: requestError } = await supabase
    .from('fund_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    throw new Error('Fund request not found');
  }

  if (request.status !== 'PENDING') {
    throw new Error('Fund request is not pending');
  }

  // Update user balance
  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', request.user_id)
    .single();

  if (user) {
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance + request.fitcoin_amount })
      .eq('id', request.user_id);

    if (balanceError) throw balanceError;
  }

  // Add euros to system total
  const { data: systemSettings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'total_euros_in_system')
    .single();

  if (systemSettings) {
    const newTotal = Number(systemSettings.value) + Number(request.euro_amount);
    const { error: systemError } = await supabase
      .from('system_settings')
      .update({ value: newTotal })
      .eq('key', 'total_euros_in_system');

    if (systemError) throw systemError;
  } else {
    // Initialize if it doesn't exist
    const { error: initError } = await supabase
      .from('system_settings')
      .insert({ key: 'total_euros_in_system', value: request.euro_amount });

    if (initError) throw initError;
  }

  // Update fund request status
  const { error: updateError } = await supabase
    .from('fund_requests')
    .update({
      status: 'APPROVED',
      admin_id: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function rejectFundRequestAction(
  requestId: string,
  adminId: string,
  notes?: string
) {
  const supabase = await createServerSupabaseClient();
  
  // Verify admin
  const { data: admin } = await supabase
    .from('users')
    .select('is_admin, name')
    .eq('id', adminId)
    .single();

  if (!admin || !admin.is_admin || admin.name !== 'Bart-Jan Decroos') {
    throw new Error('Unauthorized: Only admin can reject fund requests');
  }

  // Get fund request
  const { data: request, error: requestError } = await supabase
    .from('fund_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    throw new Error('Fund request not found');
  }

  if (request.status !== 'PENDING') {
    throw new Error('Fund request is not pending');
  }

  // Update fund request status
  const { error: updateError } = await supabase
    .from('fund_requests')
    .update({
      status: 'REJECTED',
      admin_id: adminId,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function calculatePayoutAction(userId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Get user balance
  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();

  if (!user) {
    throw new Error('User not found');
  }

  // Get total fitcoins in system (sum of all user balances)
  const { data: allUsers } = await supabase
    .from('users')
    .select('balance');

  const totalFitcoins = allUsers?.reduce((sum, u) => sum + u.balance, 0) || 0;

  // Get total euros in system
  const { data: systemSettings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'total_euros_in_system')
    .single();

  const totalEuros = systemSettings ? Number(systemSettings.value) : 0;

  // Calculate payout: (user_balance / total_fitcoins) * total_euros
  const payout =
    totalFitcoins > 0 ? (user.balance / totalFitcoins) * totalEuros : 0;

  return {
    userBalance: user.balance,
    totalFitcoins,
    totalEuros,
    payout: Math.round(payout * 100) / 100, // Round to 2 decimal places
  };
}

