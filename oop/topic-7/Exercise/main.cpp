#include <iostream>
#include "LinkedList.hpp"

using namespace std;

int main()
{
  LinkedList list;
  LinkedList::Node *&head = list.getHead();

  // Insert some values
  list.insertSorted(head, 5);
  list.insertSorted(head, 2);
  list.insertSorted(head, 9);
  list.insertSorted(head, 4);
  list.insertSorted(head, 5);

  // Display the list
  cout << "List: ";
  list.display(head);
  cout << endl;

  // Length
  cout << "Length: " << list.length(head) << endl;

  // Search
  cout << "Position of value 5: " << list.search(head, 5) << endl;
  cout << "Position of value 8: " << list.search(head, 8) << endl;

  // Remove
  list.remove(head, 5);
  cout << "List after removing first 5: ";
  list.display(head);
  cout << endl;

  return 0;
}
