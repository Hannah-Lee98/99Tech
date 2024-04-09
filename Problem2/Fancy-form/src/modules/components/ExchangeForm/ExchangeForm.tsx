import {
  Button,
  Card,
  Divider,
  InputNumber,
  Select,
  SelectProps,
  Spin,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "../../../hooks";

type FormValues = {
  currencyFrom: string;
  currencyTo: string;
  amount: number | string;
};

type Currency = {
  currency: string;
  price: number;
  date: string;
};
const filterOption = (
  input: string,
  option?: { label: string; value: string },
) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase());
const transformValue = (currencyArr: Currency[]): Record<string, Currency> => {
  const mapCurrency: Record<string, Currency> = {};

  for (const currency of currencyArr) {
    const oldValue = mapCurrency[currency.currency];

    if (oldValue) {
      if (new Date(currency.date) > new Date(oldValue.date)) {
        mapCurrency[currency.currency] = currency;
      }
      continue;
    }
    mapCurrency[currency.currency] = currency;
  }

  return mapCurrency;
};

export const ExchangeForm = () => {
  const [currencySource, setCurrencySource] = useState<
    Record<string, Currency>
  >({});
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [initValueForm, setInitValueForm] = useState<FormValues>({
    currencyFrom: "",
    currencyTo: "",
    amount: "",
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const [calculatedResult, setCalculatedResult] = useState<null | number>(null);

  useEffect(() => {
    try {
      fetch("https://interview.switcheo.com/prices.json").then(
        async (response) => {
          const data = await response.json();
          setCurrencySource(transformValue(data));
        },
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  const options = useMemo<SelectProps["options"]>(
    () =>
      Object.values(currencySource).map((i) => {
        const { currency } = i;
        return {
          value: currency,
          label: (
            <span className={"flex gap-3"}>
              <img
                role="img"
                aria-label={currency}
                alt={`currency ${currency}`}
                src={`/public/tokens/${currency}.svg`}
                className={"w-[30px] h-[30px]"}
              />
              <span className={"font-bold"}>{currency}</span>
            </span>
          ),
        };
      }),
    [currencySource],
  );

  const updateSearchParam = useCallback(
    (name: string, value?: string | number | null) => {
      setSearchParams((pre) => {
        pre.set(name, String(value === null ? "" : value));
        return pre;
      });
    },
    [setSearchParams],
  );

  const [amount, setAmount] = useState<string | number | null>(
    searchParams.get("amount"),
  );

  const debouncedAmount = useDebounce<string | number | null>(amount);

  const [finalResult, setFinalResult] = useState(calculatedResult);
  const [isCalculating, setIsCalculating] = useState(false);

  // handle display final finalResult
  useEffect(() => {
    if (!calculatedResult) return;
    setIsCalculating(true);
    const fn = setTimeout(() => {
      setFinalResult(calculatedResult);
      setIsCalculating(false);
    }, 1000);

    return () => {
      clearTimeout(fn);
    };
  }, [calculatedResult]);

  useEffect(() => {
    updateSearchParam("amount", debouncedAmount);
  }, [updateSearchParam, debouncedAmount]);

  // update Value form searchParams
  useEffect(() => {
    const newValue: Record<string, string> = {};
    for (const [key, value] of searchParams) {
      newValue[key] = value;
    }
    setInitValueForm((s) => ({ ...s, ...newValue }));
    const amount = Number(newValue["amount"]);
    const currencyFrom = currencySource[newValue["currencyFrom"]]?.price;
    const currencyTo = currencySource[newValue["currencyTo"]]?.price;

    if (currencyFrom && currencyTo && !isNaN(amount)) {
      setCalculatedResult((currencyFrom / currencyTo) * amount);
    }
  }, [currencySource, searchParams]);

  return (
    <Spin spinning={isFetchingData}>
      <Card className={"mx-[auto] mt-3 w-fit"}>
        <div className={"flex gap-3 items-center"}>
          <InputNumber
            type={"number"}
            onChange={(value) => {
              setAmount(value);
            }}
            className={"amount-input w-[300px] min-w-[200px] block h-[50px]"}
            value={initValueForm.amount}
          />
          <Select
            showSearch
            onChange={(value) => {
              updateSearchParam("currencyFrom", value);
            }}
            options={options}
            className={"w-[100px] min-w-[200px] block h-[50px]"}
            value={initValueForm.currencyFrom}
            filterOption={filterOption as SelectProps["filterOption"]}
          />
          <Button
            type={"link"}
            onClick={() => {
              setSearchParams((pre) => {
                const currencyTo = pre.get("currencyTo");
                const currencyFrom = pre.get("currencyFrom");

                pre.set("currencyFrom", currencyTo || "");
                pre.set("currencyTo", currencyFrom || "");
                return pre;
              });
            }}
          >
            Switch
          </Button>
          <Select
            showSearch
            onChange={(value) => {
              updateSearchParam("currencyTo", value);
            }}
            options={options}
            className={"w-[100px] min-w-[200px] block h-[50px]"}
            value={initValueForm.currencyTo}
            filterOption={filterOption as SelectProps["filterOption"]}
          />
        </div>
      </Card>

      <Divider />
      <div
        className={
          "mx-[auto] py-5 flex flex-col justify-center items-center gap-3"
        }
      >
        <Typography.Title>The Result</Typography.Title>
        <Spin spinning={isCalculating}>
          {finalResult ? (
            <Typography.Title level={3} className={"transition-all font-bold"}>
              🤩 {finalResult} 🤩
            </Typography.Title>
          ) : (
            <span>🫣 Nothing to do...</span>
          )}
        </Spin>
      </div>
    </Spin>
  );
};
