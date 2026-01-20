'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCurrentUserId, setUserId, getSupabaseAuthUser, linkAuthUserToUser } from '@/lib/auth';

// Authentication actions
export async function signUpAction(name: string, email: string, password: string) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:9',message:'signUpAction entry',data:{name,email},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'ALL'})}).catch(()=>{});
  // #endregion
  const supabase = await createServerSupabaseClient();
  
  // Configure email verification redirect URL
  // This URL is where users will be redirected after clicking the verification link in their email
  // 
  // IMPORTANT: The URL must be whitelisted in Supabase Dashboard:
  // - Go to Authentication → URL Configuration → Redirect URLs
  // - Add both production and localhost URLs:
  //   - https://ddfitcoin.netlify.app/auth/confirm (production)
  //   - http://localhost:3000/auth/confirm (local development)
  //
  // If the URL is not whitelisted, Supabase will fall back to the Site URL configured in the dashboard
  // See SUPABASE_SETUP.md for detailed configuration instructions
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ddfitcoin.netlify.app';
  const redirectTo = `${baseUrl}/auth/confirm`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // This redirect URL is included in the verification email
      // Supabase will redirect users here after they verify their email
      // The redirect only works if the URL is in the Supabase Redirect URLs whitelist
      emailRedirectTo: redirectTo,
    },
  });

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:36',message:'signUp response',data:{hasError:!!error,error:error?.message,hasUser:!!data?.user,userId:data?.user?.id,userEmail:data?.user?.email,emailConfirmed:!!data?.user?.email_confirmed_at},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:38',message:'signUp error path',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion
    return { success: false, error: error.message };
  }

  if (!data.user) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:42',message:'no user in response',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return { success: false, error: 'Failed to create user' };
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:58',message:'auth user details before insert',data:{authUserId:data.user.id,emailConfirmed:!!data.user.email_confirmed_at,hasEmail:!!data.user.email},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Create user record in the database and link to auth user
  // Check if user with this name already exists
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:57',message:'checking name uniqueness',data:{name:name.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('name', name)
    .single();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:65',message:'name uniqueness check result',data:{nameExists:!!existingUser},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (existingUser) {
    // User with this name already exists - return error
    // Note: We still have the auth user created, but they won't have a linked record
    return { success: false, error: 'A user with this name already exists. Please choose a different name.' };
  }

  // Create new user record with default balance of 200 fitcoins
  // Try inserting with auth_user_id first. If it fails due to foreign key constraint,
  // we'll create without it and link later during email confirmation.
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:75',message:'before insert users with auth_user_id',data:{authUserId:data.user.id,name:name.trim(),balance:200,emailConfirmed:!!data.user.email_confirmed_at},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  let { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      name: name.trim(),
      balance: 200,
      auth_user_id: data.user.id,
      is_admin: false,
      goals_set: false,
    })
    .select()
    .single();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:87',message:'after insert users attempt',data:{hasError:!!createError,errorCode:createError?.code,errorMessage:createError?.message,hasNewUser:!!newUser},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // If insert failed due to foreign key constraint (23503), create without auth_user_id and link later
  if (createError && createError.code === '23503') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:92',message:'foreign key violation - creating user without auth_user_id',data:{authUserId:data.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Create user without auth_user_id (will be linked after email confirmation)
    const { data: userWithoutAuth, error: createWithoutAuthError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        balance: 200,
        auth_user_id: null, // Will be linked after email confirmation
        is_admin: false,
        goals_set: false,
      })
      .select()
      .single();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:105',message:'user created without auth_user_id',data:{hasError:!!createWithoutAuthError,hasUser:!!userWithoutAuth,userId:userWithoutAuth?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (createWithoutAuthError) {
      // Handle database constraint errors (e.g., unique name violation)
      if (createWithoutAuthError.code === '23505') { // Unique violation error code
        return { success: false, error: 'A user with this name already exists. Please choose a different name.' };
      }
      return { success: false, error: createWithoutAuthError.message || 'Failed to create user profile' };
    }

    // Store the user ID temporarily to link after confirmation
    // The linking will happen when user confirms email and visits the confirm page
    newUser = userWithoutAuth;
    createError = null;
  }

  if (createError) {
    // Handle database constraint errors (e.g., unique name violation)
    if (createError.code === '23505') { // Unique violation error code
      return { success: false, error: 'A user with this name already exists. Please choose a different name.' };
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:120',message:'insert error path',data:{code:createError.code,message:createError.message,details:createError.details},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return { success: false, error: createError.message || 'Failed to create user profile' };
  }

  // If user was created without auth_user_id, try to link it now (auth user should exist by now)
  if (newUser && !newUser.auth_user_id) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:127',message:'attempting to link auth_user_id',data:{userId:newUser.id,authUserId:data.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const { error: linkError } = await supabase
      .from('users')
      .update({ auth_user_id: data.user.id })
      .eq('id', newUser.id);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:133',message:'link auth_user_id result',data:{hasError:!!linkError,errorMessage:linkError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // If linking fails, it's okay - user can still sign up and we'll link during email confirmation
    if (linkError) {
      console.warn('Failed to link auth_user_id immediately, will link during email confirmation:', linkError);
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2862abf4-b9a0-4172-9421-cc2e3fb38c05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:125',message:'signUpAction success',data:{userId:newUser?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'ALL'})}).catch(()=>{});
  // #endregion
  revalidatePath('/');
  return { success: true, user: data.user };
}

export async function signInAction(email: string, password: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Failed to sign in' };
  }

  revalidatePath('/');
  return { success: true, user: data.user };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function linkAuthUserToUserAction(userId: string) {
  const authUser = await getSupabaseAuthUser();
  if (!authUser) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await linkAuthUserToUser(authUser.id, userId);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to link user' };
  }
}

// Legacy login action (kept for backward compatibility)
export async function loginAction(userId: string) {
  await setUserId(userId);
  revalidatePath('/');
  return { success: true };
}

export async function createChallengeAction(
  userId: string,
  dexaGoal: string,
  functionalGoal: string
) {
  const supabase = await createServerSupabaseClient();
  
  // Check if user already has a challenge
  const { data: existingChallenge } = await supabase
    .from('challenges')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingChallenge) {
    throw new Error('Challenge already exists for this user');
  }

  // Create challenge
  const { error } = await supabase.from('challenges').insert({
    user_id: userId,
    dexa_goal: dexaGoal,
    functional_goal: functionalGoal,
  });

  if (error) throw error;

  // Give user 200 fitcoins (entry fee)
  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();

  if (user) {
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance + 200, goals_set: true })
      .eq('id', userId);

    if (balanceError) throw balanceError;
  }

  // Add 20 euros to system total (200 fitcoins = 20 euros at 10 fitcoins/euro)
  const { data: systemSettings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'total_euros_in_system')
    .single();

  if (systemSettings) {
    const newTotal = Number(systemSettings.value) + 20;
    const { error: systemError } = await supabase
      .from('system_settings')
      .update({ value: newTotal })
      .eq('key', 'total_euros_in_system');

    if (systemError) throw systemError;
  } else {
    // Initialize if it doesn't exist
    const { error: initError } = await supabase
      .from('system_settings')
      .insert({ key: 'total_euros_in_system', value: 20 });

    if (initError) throw initError;
  }

  revalidatePath('/');
  return { success: true };
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

// Utility action to unlink all users (for testing/development)
export async function unlinkAllUsersAction() {
  const supabase = await createServerSupabaseClient();
  
  // Get all users that have an auth_user_id
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .not('auth_user_id', 'is', null);

  if (fetchError) {
    // If the query fails, try updating all users (harmless to set null on already-null values)
    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_user_id: null });
    
    if (updateError) {
      throw updateError;
    }
  } else if (users && users.length > 0) {
    // Update only users that have an auth_user_id
    const userIds = users.map(u => u.id);
    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_user_id: null })
      .in('id', userIds);
    
    if (updateError) {
      throw updateError;
    }
  }

  revalidatePath('/');
  return { success: true };
}
