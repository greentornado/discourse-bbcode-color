// Function to replace [color=...] and [color="..."] BBCode with HTML spans
function replaceFontColor(text) {
  text ||= "";
  let previousText;

  // Regex Explanation:
  // \[color=       - Matches the opening tag part '[color='
  // "?             - Optionally matches an opening double quote
  // ([^\]"]+)     - Captures the color value (group 1):
  //                 - [^\]"]+ : Matches one or more characters that are NOT ']' or '"'
  // "?             - Optionally matches a closing double quote
  // \]             - Matches the closing bracket of the opening tag
  // (              - Starts capturing the content (group 2)
  //   (?:          - Starts a non-capturing group for the content logic
  //     (?!        - Starts a negative lookahead to prevent matching nested tags prematurely
  //       \[color="?[^\]"]+"?\]  - Looks ahead for another opening color tag (quoted or not)
  //       |         - OR
  //       \[\/color\] - Looks ahead for the closing tag
  //     )
  //     [\S\s]     - Matches any character (including newlines)
  //   )*?          - Repeats the non-capturing group zero or more times, non-greedily
  // )              - Ends capturing the content (group 2)
  // \[\/color\]    - Matches the closing tag '[/color]'
  // gi             - Global and case-insensitive flags
  const colorRegex = /\[color="?([^\]"]+)"?\]((?:(?!\[color="?[^\]"]+"?\]|\[\/color\])[\S\s])*?)\[\/color\]/gi;


  do {
    previousText = text;
    text = text.replace(
      colorRegex,
      (_, colorValue, content) => `<span style='color:${colorValue.trim()}'>${content}</span>`
    );
  } while (text !== previousText);

  return text;
}

// Function to replace [bgcolor=...] and [bgcolor="..."] BBCode with HTML spans
function replaceFontBgColor(text) {
  text ||= "";
  let previousText;

  // Regex follows the same logic as replaceFontColor, just for 'bgcolor'
  const bgColorRegex = /\[bgcolor="?([^\]"]+)"?\]((?:(?!\[bgcolor="?[^\]"]+"?\]|\[\/bgcolor\])[\S\s])*?)\[\/bgcolor\]/gi;

  do {
    previousText = text;
    text = text.replace(
      bgColorRegex,
      (_, bgColorValue, content) => `<span style='background-color:${bgColorValue.trim()}'>${content}</span>`
    );
  } while (text !== previousText);

  return text;
}

export function setup(helper) {
  // Allowlist remains the same, it validates the *output* style attribute
  helper.allowList({
    custom(tag, name, value) {
      if (tag === "span" && name === "style") {
        // Allows style="color:..." or style="background-color:..."
        // Allows named colors, hex codes (#fff, #ffffff)
        return /^(background-)?color\s*:\s*#?[a-zA-Z0-9]+$/.exec(value);
      }
      return false; // Deny other custom styles
    },
  });

  helper.registerOptions((opts) => {
    opts.features["bbcode-color"] = true;
  });

  if (helper.markdownIt) {
    helper.registerPlugin((md) => {
      // No changes needed here assuming markdown-it-bbcode handles quoted attributes
      // It typically parses [tag="value"] correctly and places 'value' in tagInfo.attrs._default
      const ruler = md.inline.bbcode.ruler;

      ruler.push("bgcolor", {
        tag: "bgcolor",
        wrap: function (token, endToken, tagInfo) {
          token.type = "span_open";
          token.tag = "span";
          // Ensure trimming for safety, though likely already handled by parser
          token.attrs = [
            ["style", "background-color:" + tagInfo.attrs._default.trim()],
          ];
          token.content = "";
          token.nesting = 1;

          endToken.type = "span_close";
          endToken.tag = "span";
          endToken.nesting = -1;
          endToken.content = "";
        },
      });

      ruler.push("color", {
        tag: "color",
        wrap: function (token, endToken, tagInfo) {
          token.type = "span_open";
          token.tag = "span";
          // Ensure trimming for safety
          token.attrs = [["style", "color:" + tagInfo.attrs._default.trim()]];
          token.content = "";
          token.nesting = 1;

          endToken.type = "span_close";
          endToken.tag = "span";
          endToken.nesting = -1;
          endToken.content = "";
        },
      });
    });
  } else {
    // Use the updated pre-processors for the fallback scenario
    helper.addPreProcessor((text) => replaceFontColor(text));
    helper.addPreProcessor((text) => replaceFontBgColor(text));
  }
}
