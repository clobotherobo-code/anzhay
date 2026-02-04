use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("6Fg5b38qMMwUarNA1bACM8rZnW8VsJwUz757moGaHGDC");

#[program]
pub mod anzhay_flip {
    use super::*;

    /// Creator creates a room and deposits `amount` lamports into escrow PDA.
    pub fn create_room(ctx: Context<CreateRoom>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        let room = &mut ctx.accounts.room;
        room.creator = ctx.accounts.creator.key();
        room.amount = amount;
        room.challenger = None;
        room.challenger_choice = None;
        room.result = None;
        room.bump = ctx.bumps.room;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.room.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    /// Challenger joins and deposits same `amount`. choice: 0 = heads, 1 = tails.
    pub fn join_room(ctx: Context<JoinRoom>, choice: u8) -> Result<()> {
        require!(choice <= 1, ErrorCode::InvalidChoice);
        let room = &mut ctx.accounts.room;
        require!(room.challenger.is_none(), ErrorCode::RoomFull);
        room.challenger = Some(ctx.accounts.challenger.key());
        room.challenger_choice = Some(choice);

        let amount = room.amount;
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.challenger.to_account_info(),
                to: ctx.accounts.room.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    /// Resolve: result 0 = heads, 1 = tails. Winner gets all escrowed SOL. Callable by creator or challenger.
    pub fn resolve(ctx: Context<Resolve>, result: u8) -> Result<()> {
        require!(result <= 1, ErrorCode::InvalidChoice);
        let room = &mut ctx.accounts.room;
        require!(room.challenger.is_some(), ErrorCode::NoChallenger);
        require!(room.result.is_none(), ErrorCode::AlreadyResolved);

        let winner_key = {
            let choice = room.challenger_choice.unwrap();
            if result == choice {
                room.challenger.unwrap()
            } else {
                room.creator
            }
        };
        require!(ctx.accounts.winner.key() == winner_key, ErrorCode::InvalidWinner);
        require!(
            ctx.accounts.authority.key() == room.creator || ctx.accounts.authority.key() == room.challenger.unwrap(),
            ErrorCode::Unauthorized
        );

        room.result = Some(result);

        let room_balance = ctx.accounts.room.to_account_info().lamports();
        let rent = Rent::get()?;
        let rent_balance = rent.minimum_balance(ctx.accounts.room.to_account_info().data_len());
        let to_send = room_balance.saturating_sub(rent_balance);
        require!(to_send > 0, ErrorCode::InsufficientBalance);

        **ctx.accounts.room.to_account_info().try_borrow_mut_lamports()? -= to_send;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += to_send;

        Ok(())
    }
}

#[account]
pub struct Room {
    pub creator: Pubkey,
    pub amount: u64,
    pub challenger: Option<Pubkey>,
    pub challenger_choice: Option<u8>,
    pub result: Option<u8>,
    pub bump: u8,
}

impl Room {
    pub const SPACE: usize = 32 + 8 + (1 + 32) + (1 + 1) + (1 + 1) + 1;
}

#[derive(Accounts)]
pub struct CreateRoom<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Room::SPACE,
        seeds = [b"room", creator.key().as_ref()],
        bump
    )]
    pub room: Account<'info, Room>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinRoom<'info> {
    #[account(mut)]
    pub challenger: Signer<'info>,

    #[account(
        mut,
        seeds = [b"room", room.creator.as_ref()],
        bump = room.bump,
        constraint = room.challenger.is_none() @ ErrorCode::RoomFull,
        constraint = room.creator != challenger.key() @ ErrorCode::CannotJoinOwnRoom
    )]
    pub room: Account<'info, Room>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Choice must be 0 (heads) or 1 (tails)")]
    InvalidChoice,
    #[msg("Room already has a challenger")]
    RoomFull,
    #[msg("No challenger has joined")]
    NoChallenger,
    #[msg("Room already resolved")]
    AlreadyResolved,
    #[msg("Cannot join your own room")]
    CannotJoinOwnRoom,
    #[msg("Insufficient balance in room")]
    InsufficientBalance,
    #[msg("Winner account does not match result")]
    InvalidWinner,
    #[msg("Only creator or challenger can resolve")]
    Unauthorized,
}

#[derive(Accounts)]
pub struct Resolve<'info> {
    /// Creator or challenger can call resolve
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"room", room.creator.as_ref()],
        bump = room.bump,
        constraint = room.result.is_none() @ ErrorCode::AlreadyResolved,
        constraint = room.challenger.is_some() @ ErrorCode::NoChallenger
    )]
    pub room: Account<'info, Room>,

    /// CHECK: winner is creator or challenger, validated in instruction
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
