#include <iostream>
#include <vector>
#include <string>
#include <limits>

enum class OrderBookType
{
    bid,
    ask
};

class OrderBookEntry
{
public:
    std::string timestamp;
    std::string product;
    OrderBookType orderType;
    double price;
    double amount;

    OrderBookEntry(std::string _timestamp,
                   std::string _product,
                   OrderBookType _orderType,
                   double _price,
                   double _amount)
        : timestamp(_timestamp), product(_product),
          orderType(_orderType), price(_price), amount(_amount) {}
};

double computeAveragePrice(const std::vector<OrderBookEntry> &entries)
{
    if (entries.empty())
        return 0;
    double total = 0;
    for (const auto &e : entries)
        total += e.price;
    return total / entries.size();
}

double computeLowPrice(const std::vector<OrderBookEntry> &entries)
{
    double minPrice = std::numeric_limits<double>::max();
    for (const auto &e : entries)
    {
        if (e.price < minPrice)
            minPrice = e.price;
    }
    return minPrice;
}

double computeHighPrice(const std::vector<OrderBookEntry> &entries)
{
    double maxPrice = std::numeric_limits<double>::lowest();
    for (const auto &e : entries)
    {
        if (e.price > maxPrice)
            maxPrice = e.price;
    }
    return maxPrice;
}

double computePriceSpread(const std::vector<OrderBookEntry> &entries)
{
    return computeHighPrice(entries) - computeLowPrice(entries);
}

int main()
{
    std::vector<OrderBookEntry> entries;

    entries.emplace_back("2020/03/17 17:01:24.884492", "ETH/BTC", OrderBookType::bid, 0.02186299, 0.1);
    entries.emplace_back("2020/03/17 17:01:25.123456", "ETH/BTC", OrderBookType::ask, 0.02190000, 0.2);
    entries.emplace_back("2020/03/17 17:01:26.654321", "ETH/BTC", OrderBookType::bid, 0.02185000, 0.15);

    std::cout << "Average Price: " << computeAveragePrice(entries) << std::endl;
    std::cout << "Low Price: " << computeLowPrice(entries) << std::endl;
    std::cout << "High Price: " << computeHighPrice(entries) << std::endl;
    std::cout << "Price Spread: " << computePriceSpread(entries) << std::endl;

    return 0;
}
