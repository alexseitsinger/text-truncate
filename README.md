# Text Truncate

## Description

A simple react component that replaces long text with an ellipsis based on width of container, and number of lines allowed.

## Installation

```javascript
npm install @alexseitsinger/text-truncate
```

or

```javascript
yarn add @alexseitsinger/text-truncate
```

## Usage

```javascript
import TextTruncate from "@alexseitsinger/text-truncate"

<TextTruncate lines={3}
              text={"This is a short string of text that will be truncated when its content extends outside the dimensions of it's container. Change the line number to determine how much text to show before replacing the rest with an ellipsis."}/>
```