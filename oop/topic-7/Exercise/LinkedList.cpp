#include "LinkedList.hpp"
using namespace std;

// Constructor: initializes head to nullptr
LinkedList::LinkedList()
{
  head = nullptr;
}

// Destructor: deletes all nodes in the list
LinkedList::~LinkedList()
{
  Node *curr = head;
  while (curr != nullptr)
  {
    Node *temp = curr;
    curr = curr->next;
    delete temp;
  }
}

// Inserts a value in sorted order (ascending)
void LinkedList::insertSorted(LinkedList::Node *&_head, int _value)
{
  Node *newNode = new Node(_value);
  // Case: empty list or new value is less than the head
  if (_head == nullptr || _value < _head->data)
  {
    newNode->next = _head;
    _head = newNode;
    return;
  }
  // Find correct position to insert
  Node *curr = _head;
  while (curr->next != nullptr && curr->next->data < _value)
  {
    curr = curr->next;
  }
  newNode->next = curr->next;
  curr->next = newNode;
}

// Returns the number of elements in the list
int LinkedList::length(LinkedList::Node *&_head)
{
  int count = 0;
  Node *curr = _head;
  while (curr != nullptr)
  {
    count++;
    curr = curr->next;
  }
  return count;
}

// Returns the position of the first element equal to _value, or -1 if not found
int LinkedList::search(LinkedList::Node *&_head, int _value)
{
  int pos = 0;
  Node *curr = _head;
  while (curr != nullptr)
  {
    if (curr->data == _value)
    {
      return pos;
    }
    curr = curr->next;
    pos++;
  }
  return -1;
}

// Removes the first occurrence of _value from the list
void LinkedList::remove(LinkedList::Node *&_head, int _value)
{
  if (_head == nullptr)
    return;
  // Case: the element to remove is the head
  if (_head->data == _value)
  {
    Node *temp = _head;
    _head = _head->next;
    delete temp;
    return;
  }
  Node *curr = _head;
  while (curr->next != nullptr && curr->next->data != _value)
  {
    curr = curr->next;
  }
  if (curr->next != nullptr)
  {
    Node *temp = curr->next;
    curr->next = curr->next->next;
    delete temp;
  }
}

// Prints the list content
void LinkedList::display(LinkedList::Node *&_head)
{
  Node *iterator = _head; // Do not want to move the actual head, make a copy
  if (iterator == NULL)
  {
    cout << "The list is empty";
  }
  while (iterator != NULL)
  {
    cout << "[" + std::to_string(iterator->data) + "] ";
    iterator = iterator->next;
  }
}

// Returns a reference to the head pointer
LinkedList::Node *&LinkedList::getHead()
{
  return head;
}
