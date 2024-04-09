interface WalletBalance {
  // #11: Each wallet should have id to identity, i don't think we have a wallet that have no id
  id: string;
  currency: string;
  amount: number;
}

// #0: We can remove the duplication of currency and amount for FormattedWalletBalance by reuse the type WalletBalance for base
// #1: Add usdValue property as a part of formatted wallet balance
type FormattedWalletBalance = WalletBalance & {
  formatted: string;
  usdValue: string;
};

// #3: getPriority should be separate and move out of the component
// - First we don't want to create a new getPriority for every render
// - Second move out of the component, we can reuse it in other components or any part of our project
// - Third, we can improve it by using the map object, it will be a little bit faster if we compare to switch case
// - Lastly, we can define the type for restrict the values for our blockchain

export type PopularBlockChain =
  | "Osmosis"
  | "Ethereum"
  | "Arbitrum"
  | "Zilliqa"
  | "Neo"
  | string;

export const BLOCK_CHAIN_PRIORITY_MAP: Record<PopularBlockChain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 50,
  Zilliqa: 20,
  Neo: 20,
};

export const getPriority = (blockchain: PopularBlockChain): number => {
  return BLOCK_CHAIN_PRIORITY_MAP[blockchain] || -99;
};

interface Props extends BoxProps {}

// #4: The Props can be wrapped with Readyonly, it can prevent the developer do some changes on our props
// - If we don't use children prop, we can remove React.FC, if the user try to pass it, it will throw error from typesecript
export const WalletPage: Readyonly<Props> = (props: Props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return (
      balances
        // #5: If the logic is wrong here, our expectation should be get all the balances that have amount > 0, so the logic should simple like that
        .filter(
          (balance: WalletBalance) => balance.amount > 0
          // #6: If we need to filter out all the balance that have blockchain have -99 we can do like that
          // => (balance.amount > 0 && getPriority(balance.blockchain) !== -99);
        )
        // #7: This is solution to make the comparation between two number easier, i guess we are all know about it https://forum.freecodecamp.org/t/whats-the-subtraction-doing-in-this-sort-function/502081
        // #8: Apply arrow function to shorten the code
        .sort(
          (lhs: WalletBalance, rhs: WalletBalance) =>
            getPriority(rhs.blockchain) - getPriority(lhs.blockchain)
        )
    );
    // #9: Remove prices from dependencies of the useMemo, we don't want to calculate again whenever the prices value changes, we don't use prices in our useMemo either
  }, [balances]);

  // #10: This is step to transform balance to formatted balence, but we don't use it in the WalletRow
  // #11: Should define type for formattedBalances
  // #12: We can handle usdValue in formattedBalances, it should be a part of formatted data, it will make sense
  // #13: Missing useMemo in here, we just want to map the formattedBalances again whenver the sortedBalances and prices changes

  const formattedBalances = useMemo<FormattedWalletBalance[]>(
    () =>
      sortedBalances.map((balance: WalletBalance) => ({
        ...balance,
        // #14: add toFixed for the usdValue as well
        usdValue: (prices[balance.currency] * balance.amount).toFixed(),
        formatted: balance.amount.toFixed(),
      })),
    [sortedBalances, prices]
  );

  const rows = formattedBalances.map((balance: FormattedWalletBalance) => {
    return (
      <WalletRow
        className={classes.row}
        // 15:key should not use index, each wallet should have id, if we don't have id, if each wallet just for unique blockchain we can use balance.blockchain
        key={balance.id}
        amount={balance.amount}
        usdValue={balance.usdValue}
        formattedAmount={balance.formatted}
      />
    );
  });

  return <div {...props}>{rows}</div>;
};
