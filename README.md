# Marked Comment Toggling

This package is meant to provide an alternative to the built-in comment toggling by marking the comments similar to Geany.  This minimizes interference with already present comments.  

![demo-toggle](https://raw.githubusercontent.com/mtnQ/comment-toggle-and-mark/master/.media/demo-toggle.gif)

Commenting is done line-by-line.  Languages that only have block-style comments having one prefix-suffix pair per line (e.g., ```Some HTML statement``` becomes ```<!--~ Some HTML statement -->```).

In addition, there is also the ability to delete all marked comments in a document to quickly clean up commented-out code.

![demo-delete](https://raw.githubusercontent.com/mtnQ/comment-toggle-and-mark/master/.media/demo-delete.gif)

## Supported Languages

The comment style used is dependent on the current grammar of the editor (supplied in the ```language-``` packages).  Supported languages include C, C++, Java, JavaScript, and Python, among others.
