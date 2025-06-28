#include "Wallet.h"

void Wallet::insertCurrency(const std::string &type, double amount)
{
    if (amount < 0)
    {
        throw std::invalid_argument("insertCurrency: amount must be >= 0");
    }
    // if the currency doesn't exist yet, initialize its balance to zero
    if (currencies.count(type) == 0)
    {
        currencies[type] = 0.0;
    }
    // add the amount to the current balance
    currencies[type] += amount;
}

bool Wallet::containsCurrency(const std::string &type, double amount) const
{
    if (amount < 0)
    {
        throw std::invalid_argument("containsCurrency: amount must be >= 0");
    }
    auto it = currencies.find(type);
    // return true only if currency exists and balance >= requested amount
    return (it != currencies.end() && it->second >= amount);
}

bool Wallet::removeCurrency(const std::string &type, double amount)
{
    if (amount < 0)
    {
        throw std::invalid_argument("removeCurrency: amount must be >= 0");
    }
    // if not enough balance, do nothing and return false
    if (!containsCurrency(type, amount))
    {
        return false;
    }
    // deduct the amount and return true
    currencies[type] -= amount;
    return true;
}

std::string Wallet::toString() const
{
    std::ostringstream oss;
    for (const auto &p : currencies)
    {
        oss << p.first << " : " << p.second << "\n";
    }
    return oss.str();
}
