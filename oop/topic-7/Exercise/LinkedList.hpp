#pragma once
#include <iostream>

class LinkedList
{
public:
  // Node definition as public, with value constructor
  struct Node
  {
    int data;
    Node *next;
    Node(int val) : data(val), next(nullptr) {}
  };

  LinkedList();
  ~LinkedList();

  void insertSorted(Node *&_head, int _value);
  int length(Node *&_head);
  int search(Node *&_head, int _value);
  void remove(Node *&_head, int _value);
  void display(Node *&_head);
  Node *&getHead();

private:
  Node *head;
};
