'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase';
import { clearSession } from '@/lib/auth';

// Authentication actions
export async function signUpAction(name: string, email: string, password: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user with this name already exists
    const { data: existingUserByName, error: nameCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle();

    if (nameCheckError) {
      console.error('Error checking existing user by name:', nameCheckError);
      // Handle RLS errors
      if (nameCheckError.code === '42501' || nameCheckError.message?.includes('row-level security') || nameCheckError.message?.includes('RLS')) {
        return { success: false, error: 'Permission denied. Please ensure Row Level Security policies are configured. Contact support.' };
      }
    }

    if (existingUserByName) {
      return { success: false, error: 'A user with this name already exists. Please choose a different name.' };
    }

    // Create auth user in Supabase Auth (email verification disabled)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        emailRedirectTo: undefined, // Disable email verification
        data: {
          name: name.trim(),
        },
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      // Handle email already exists error
      if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
        return { success: false, error: 'A user with this email already exists. Please use a different email or sign in.' };
      }
      return { success: false, error: authError.message || 'Failed to create account. Please try again.' };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create account' };
    }

    // Create corresponding user record in public.users with auth_user_id
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        auth_user_id: authData.user.id,
        balance: 200,
        is_admin: false,
        goals_set: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user record:', createError);
      // If user record creation fails, try to clean up auth user
      // Note: We can't easily delete auth user from server action, but the unique constraint will prevent issues
      
      // Handle database constraint errors
      if (createError.code === '23505') { // Unique violation error code
        if (createError.message.includes('email')) {
          return { success: false, error: 'A user with this email already exists. Please use a different email or sign in.' };
        }
        return { success: false, error: 'A user with this name already exists. Please choose a different name.' };
      }
      return { success: false, error: createError.message || 'Failed to create user profile. Please try again.' };
    }

    if (!newUser) {
      return { success: false, error: 'Failed to create user profile' };
    }

    // Session is automatically set by Supabase Auth signUp
    revalidatePath('/');
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Unexpected error in signUpAction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}

export async function signInAction(email: string, password: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Sign in using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password,
    });

    if (authError || !authData.user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Get the corresponding user record from public.users
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (fetchError || !user) {
      // Auth user exists but no public.users record - this shouldn't happen but handle gracefully
      console.error('User found in auth but not in public.users:', authData.user.id);
      return { success: false, error: 'Account not properly set up. Please contact support.' };
    }

    // Session is automatically set by Supabase Auth signIn
    revalidatePath('/');
    return { success: true, user };
  } catch (error: any) {
    console.error('Unexpected error in signInAction:', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}

export async function signOutAction() {
  await clearSession();
  revalidatePath('/');
  return { success: true };
}

export async function forgotPasswordAction(email: string) {
  const supabase = await createServerSupabaseClient();
  
  // Use Supabase Auth password reset
  // This will send an email with a reset link
  // Don't reveal if email exists or not (security best practice)
  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  });

  // Always return success to prevent email enumeration
  // If there's an error, log it but don't reveal to user
  if (error) {
    console.error('Error sending password reset email:', error);
  }
  
  return { success: true };
}

export async function resetPasswordAction(newPassword: string) {
  const supabase = await createServerSupabaseClient();
  
  // Update password using Supabase Auth
  // The user must have a valid session from the password reset link
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message || 'Failed to reset password. Please try again.' };
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

    // Mark goals as set (users only get 200 coins on signup, not when creating challenge)
    const { error: updateError } = await supabase
      .from('users')
      .update({ goals_set: true })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user goals_set:', updateError);
      return { success: false, error: 'Failed to update user. Please try again.' };
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
  challengeType: 'DEXA' | 'FUNCTIONAL' | 'BOTH',
  prediction: 'PASS' | 'FAIL',
  amount: number
) {
  const supabase = await createServerSupabaseClient();
  
  // Determine how many wagers to create and total amount needed
  const isBoth = challengeType === 'BOTH';
  const totalAmount = isBoth ? amount * 2 : amount;
  const challengeTypes: ('DEXA' | 'FUNCTIONAL')[] = isBoth ? ['DEXA', 'FUNCTIONAL'] : [challengeType as 'DEXA' | 'FUNCTIONAL'];
  
  // Deduct from creator
  const { data: creator } = await supabase
    .from('users')
    .select('balance')
    .eq('id', creatorId)
    .single();

  if (!creator || creator.balance < totalAmount) {
    throw new Error(`Insufficient balance. You need ${totalAmount} FitCoins (${isBoth ? `${amount} for each challenge type` : `${amount} total`})`);
  }

  const { error: deductError } = await supabase
    .from('users')
    .update({ balance: creator.balance - totalAmount })
    .eq('id', creatorId);

  if (deductError) throw deductError;

  // Create wager(s) - one for each challenge type
  for (const type of challengeTypes) {
    const { error: wagerError } = await supabase.from('wagers').insert({
      creator_id: creatorId,
      target_user_id: targetUserId,
      challenge_type: type,
      prediction,
      amount,
      status: 'OPEN',
    });

    if (wagerError) throw wagerError;
  }

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

  // Find all open wagers for this user/challenge type
  const { data: wagers, error: wagersError } = await supabase
    .from('wagers')
    .select('*')
    .eq('target_user_id', userId)
    .eq('challenge_type', challengeType)
    .eq('status', 'OPEN');

  if (wagersError) throw wagersError;

  // Settle each wager
  for (const wager of wagers || []) {
    const predictedPass = wager.prediction === 'PASS';
    const actualPass = status === 'PASSED';
    const predictionCorrect = predictedPass === actualPass;

    if (predictionCorrect) {
      // Creator wins: award 2x their bet (bet back + reward)
      const { data: creator } = await supabase
        .from('users')
        .select('balance')
        .eq('id', wager.creator_id)
        .single();

      if (creator) {
        const pot = wager.amount * 2;
        const { error: awardError } = await supabase
          .from('users')
          .update({ balance: creator.balance + pot })
          .eq('id', wager.creator_id);

        if (awardError) throw awardError;
      }

      // Mark wager as settled with winner
      const { error: settleError } = await supabase
        .from('wagers')
        .update({
          status: 'SETTLED',
          winner_id: wager.creator_id,
        })
        .eq('id', wager.id);

      if (settleError) throw settleError;
    } else {
      // Creator loses: bet already deducted, just mark as settled
      const { error: settleError } = await supabase
        .from('wagers')
        .update({
          status: 'SETTLED',
          winner_id: null,
        })
        .eq('id', wager.id);

      if (settleError) throw settleError;
    }
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

export async function setChallengeEndDateAction(
  adminId: string,
  endDate: string
) {
  const supabase = await createServerSupabaseClient();
  
  // Verify admin
  const { data: admin } = await supabase
    .from('users')
    .select('is_admin, name')
    .eq('id', adminId)
    .single();

  if (!admin || !admin.is_admin || admin.name !== 'Bart-Jan Decroos') {
    throw new Error('Unauthorized: Only admin can set challenge end date');
  }

  // Check if challenge_end_date already exists
  const { data: existing } = await supabase
    .from('system_settings')
    .select('id')
    .eq('key', 'challenge_end_date')
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('system_settings')
      .update({
        timestamp_value: endDate,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'challenge_end_date');

    if (error) throw error;
  } else {
    // Insert new
    const { error } = await supabase
      .from('system_settings')
      .insert({
        key: 'challenge_end_date',
        value: 0, // Required field, but we use timestamp_value
        timestamp_value: endDate,
      });

    if (error) throw error;
  }

  revalidatePath('/admin');
  revalidatePath('/challenges');
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

