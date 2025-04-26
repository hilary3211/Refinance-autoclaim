# CompoundX Auto-Claim and Compounding Bot

## Description

This is a Node.js bot (Bot.js) that automates the process of auto-claiming rewards and compounding reinvestments for users on CompoundX, a decentralized exchange (DEX) on the NEAR blockchain.


## Key Features
- Auto-Claim Rewards: Automatically claims rewards for users based on their staking positions

- Compounding Reinvestment: Reinvests claimed rewards back into the user's staking positions.

- 5% Reward for Bot Operator: The bot operator (or user running the bot) receives 5% of all rewards compounded by all users.

- Hourly Execution: The bot can only perform auto-claiming and compounding once every hour to prevent spamming the blockchain.



## How It Works

1. User Preferences:

- Users provide their preferences (e.g., staking pools, token IDs, etc.) to the bot.

- The bot stores these preferences and uses them to determine which rewards to claim and where to reinvest them.

2. Auto-Claiming:

- The bot interacts with the CompoundX smart contract to claim rewards for all users.

3. Compounding:

- After claiming rewards, the bot reinvests them into the user's selected staking pools.

4. Bot Operator Reward:

- The bot operator receives 5% of all rewards compounded by the bot.

5. Scheduling:

- The bot runs once every hour 


# How to Run Locally

## Prerequisites 

Node.js: Ensure you have Node.js installed (v16 or higher).


## Steps

- Clone the repository 

```
git clone https://github.com/hilary3211/Refinance-autoclaim.git
```
- Navigate to the project directory

```
cd Refinance-autoclaim
cd backend
```
- Install dependencies
```
 npm install
```
- Configure Environment Variables

Create a .env file in the root directory and add the following variables:

```
NEAR_ENV=
ACC_ENV=
ACC_NAM=
ACC_ID=
```
- Run the Bot
```
node Bot.js
```





