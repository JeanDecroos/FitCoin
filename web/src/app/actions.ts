'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId, setUserId } from '@/lib/auth';

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
  const { error } = await supabase.from('challenges').insert({
    user_id: userId,
    dexa_goal: dexaGoal,
    functional_goal: functionalGoal,
  });

  if (error) throw error;

  const { error: updateError } = await supabase
    .from('users')
    .update({ goals_set: true })
    .eq('id', userId);

  if (updateError) throw updateError;

  revalidatePath('/');
  redirect('/dashboard');
}

export async function createWagerAction(
  creatorId: string,
  targetUserId: string,
  challengeType: 'DEXA' | 'FUNCTIONAL',
  prediction: 'PASS' | 'FAIL',
  amount: number
) {
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

