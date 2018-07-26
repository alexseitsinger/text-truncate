import React from "react";
import PropTypes from "prop-types";
import {debounce} from "./utils";


class TextTruncate extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    lines: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.textElement = null;
    this.state = {
      truncatedText: ""
    };
    // Debounce the event to avoid duplicates and unnecessary renders.
    this.handleResizeDebounced = debounce(this.handleResize, 500);
    window.addEventListener("resize", this.handleResizeDebounced);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResizeDebounced);
  }

  // Ensure our text stays formatted correctly, by re-formatting it after
  // every window resize.
  handleResize = event => {
    this.updateTruncatedText();
  };

  // Create a long-hand font style string for use on canvas.
  getFontString = () => {
    const cs = window.getComputedStyle(this.textElement);
    const fontString = [
      cs["font-style"],
      cs["font-variant"],
      cs["font-weight"],
      cs["font-size"] + "/" + cs["line-height"],
      cs["font-family"]
    ].join(" ");
    return fontString;
  };

  // Return the rounded width of the text.
  getTextWidth = (text, whitespace) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    // Ensure the parent style has the correct font styling prepared.
    context.font = this.getFontString();
    const dims = context.measureText(text + (whitespace ? " " : ""));
    var width = dims.width;
    var w = Math.ceil(width);
    return w;
  };

  // Return an array of segments, which consist of strings and widths.
  getSegments = (bits, maxWidth) => {
    // Save each bit that we cycle through so we can continue making the
    // next segment after it easily.
    var included = [];
    var excluded = [];
    // Continue to sum the array to get the currentl segment length.
    // We don't want to go over the maxWidth, so we continue to measure this
    // with each bit we cycle through.
    var getSum = arr => {
      if (arr.length === 1) {
        return arr[0][1];
      } else {
        return arr.pop()[1] + getSum(arr);
      }
    };
    // Once full is true, the maxWidth has been reached, so move the rest
    // of the bits into the excluded array. They will be used in the next
    // getSegments() call.
    var full = false;
    bits.forEach((arr, i) => {
      if (full) {
        excluded.push(arr);
      } else {
        if (!included.length) {
          included.push(arr);
        } else {
          // find the total sum found so far for text
          var sum = 0;
          included.forEach(a => {
            sum = sum + a[1];
          });
          if (sum + arr[1] <= maxWidth) {
            included.push(arr);
          } else {
            full = true;
            excluded.push(arr);
          }
        }
      }
    });
    var ret = {
      included: included,
      excluded: excluded
    };
    return ret;
  };

  // Compile an array of sections that compose the text string, based on
  // the width of the parent container against the width of each bit of text.
  buildSections = () => {
    // Use the width of the parent container to determine where to split
    // each section of text up by.
    var maxWidth = this.textElement.getBoundingClientRect().width;
    const fullText = this.props.text;
    const bits = fullText.split(" ").map((bit, i, arr) => {
      var bitWidth = 0;
      // Include whitespace width into each bit, except the last.
      if (i + 1 == arr.length) {
        bitWidth = this.getTextWidth(bit);
      } else {
        bitWidth = this.getTextWidth(bit, true);
      }
      return [bit, bitWidth];
    });
    // Keep making sections until we section off all the bits.
    var sections = [];
    var makeSection = startBits => {
      var segment = this.getSegments(startBits, maxWidth);
      sections.push(segment);
      var totalIncluded = 0;
      sections.forEach(section => {
        totalIncluded += section.included.length;
      });
      if (totalIncluded != bits.length) {
        makeSection(segment.excluded);
      }
    };
    // Start making sections using all the bits.
    makeSection(bits);
    // Return the sections for string formatting.
    return {
      bits: bits,
      sections: sections
    };
  };

  updateTruncatedText = () => {
    // Format the text to fit the number of lines specified.
    var lines = this.props.lines;
    var totalLines = lines
    // Build the sections of text that fit the parent container width.
    var { bits, sections } = this.buildSections();
    var totalSections = Object.keys(sections).length
    // Collect the string sections into a shortened string.
    var includedSections = [];
    while (lines--) {
      if (sections.length) {
        var section = sections.shift();
        var includedSection = section.included
          .map(a => {
            return a[0];
          })
          .join(" ");
        includedSections.push(includedSection);
      }
    }

    // Combine the bits into a string, with an ellipsis at the end
    // if it was truncated.
    var truncatedText = "";
    if (
      includedSections.length === 1 &&
      includedSections.length === bits.length ||
      totalSections <= totalLines
    ) {
      truncatedText = includedSections.join(" ");
    } else {
      var lastSection = includedSections.pop()
      var lastSectionLength = lastSection.length
      var ellipsis = "..."
      var lastSectionRem = (lastSectionLength - ellipsis.length)
      var newLastSection = lastSection.slice(0, lastSectionRem)
      includedSections.push(newLastSection)
      truncatedText = includedSections.concat([ellipsis]).join(" ");
    }
    // Save the truncated text string to state for rendering.
    this.setState({
      truncatedText: truncatedText
    });
  };

  componentDidMount() {
    // Since we need the refs rendered in order to format the text, do the
    // initial update after its mounted.
    this.updateTruncatedText();
  }

  render() {
    const { customClassName } = this.props;
    const { truncatedText } = this.state;
    return (
      <div
        className={customClassName}
        ref={el => {
          this.textElement = el;
        }}
      >
        {truncatedText}
      </div>
    );
  }
}

export default TextTruncate;
