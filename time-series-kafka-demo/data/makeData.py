#!/usr/bin/env python

"""Make sample time series data.
"""
import numpy as np
import pandas as pd


def main():
    date_rng = pd.date_range(start='04/25/2022', end='04/26/2022', freq='s')
    df = pd.DataFrame(date_rng, columns=['timeArrival','name', 'description', 'countryId'])

    np.random.seed(42)
    df['timeService'] = np.random.randint(0, 100, size=(len(date_rng)))
    df = df.sample(frac=0.5, random_state=42).sort_values(by=['timeArrival'])
    df.to_csv('data.csv', index=False)
    return


if __name__ == "__main__":
    main()
