// Wallet.h
#pragma once

#include <string>
#include <map>
#include <stdexcept>
#include <sstream>

class Wallet
{
public:
    Wallet() = default;

    /** add currency to the wallet */
    void insertCurrency(const std::string &type, double amount);

    /** remove currency from the wallet, return true if removed, false if insufficient funds */
    bool removeCurrency(const std::string &type, double amount);

    /** check if the wallet contains at least `amount` of `type` */
    bool containsCurrency(const std::string &type, double amount) const;

    /** string representation of the wallet contents */
    std::string toString() const;

    /** allow `std::cout << wallet` */
    friend std::ostream &operator<<(std::ostream &os, const Wallet &wallet)
    {
        os << wallet.toString();
        return os;
    }

private:
    std::map<std::string, double> currencies;
};
