// Function to replace [color=...] / [COLOR=...] with optional standard/curly quotes
function replaceFontColor(text) {
  text ||= "";
  let previousText;

  // Regex Explanation:
  // \[color=       - Matches the opening tag part '[color=' (case-insensitive due to 'i' flag)
  // ["“]?          - Optionally matches an opening standard (") or curly (“) double quote
  // ([^\]"“”]+)   - Captures the color value (group 1):
  //                 - [^\]"“”]+ : Matches one or more characters that are NOT ']', standard quote ("), or curly quotes (“”)
  // ["”]?          - Optionally matches a closing standard (") or curly (”) double quote
  // \]             - Matches the closing bracket of the opening tag
  // (              - Starts capturing the content (group 2)
  //   (?:          - Starts a non-capturing group for the content logic
  //     (?!        - Starts a negative lookahead to prevent matching nested tags prematurely
  //       \[color=["“]?[^\]"“”]+["”]?\]  - Looks ahead for another opening color tag (any quotes/case)
  //       |         - OR
  //       \[\/color\] - Looks ahead for the closing tag (case-insensitive)
  //     )
  //     [\S\s]     - Matches any character (including newlines)
  //   )*?          - Repeats the non-capturing group zero or more times, non-greedily
  // )              - Ends capturing the content (group 2)
  // \[\/color\]    - Matches the closing tag '[/color]' (case-insensitive)
  // gi             - Global, case-insensitive flags
  const colorRegex = /\[color=["“]?([^\]"“”]+)["”]?\]((?:(?!\[color=["“]?[^\]"“”]+["”]?\]|\[\/color\])[\S\s])*?)\[\/color\]/gi;


  do {
    previousText = text;
    text = text.replace(
      colorRegex,
      (_, colorValue, content) => `<span style='color:${colorValue.trim()}'>${content}</span>`
    );
  } while (text !== previousText);

  return text;
}

// Function to replace [bgcolor=...] / [BGCOLOR=...] with optional standard/curly quotes
function replaceFontBgColor(text) {
  text ||= "";
  let previousText;

  // Regex follows the same logic as replaceFontColor, just for 'bgcolor'
  const bgColorRegex = /\[bgcolor=["“]?([^\]"“”]+)["”]?\]((?:(?!\[bgcolor=["“]?[^\]"“”]+["”]?\]|\[\/bgcolor\])[\S\s])*?)\[\/bgcolor\]/gi;

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
  // Allowlist remains the same
  helper.allowList({
    custom(tag, name, value) {
      if (tag === "span" && name === "style") {
        return /^(background-)?color\s*:\s*#?[a-zA-Z0-9]+$/.exec(value);
      }
      return false;
    },
  });

  helper.registerOptions((opts) => {
    opts.features["bbcode-color"] = true;
  });

  if (helper.markdownIt) {
    helper.registerPlugin((md) => {
      // No changes needed here. Relies on markdown-it-bbcode's capabilities.
      // It typically handles case-insensitivity for tags.
      // Handling of curly quotes depends entirely on the markdown-it-bbcode parser itself.
      const ruler = md.inline.bbcode.ruler;

      ruler.push("bgcolor", {
        tag: "bgcolor", // Tag name here might be case-sensitive depending on plugin config, but matching is usually case-insensitive
        wrap: function (token, endToken, tagInfo) {
          token.type = "span_open";
          token.tag = "span";
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
    // Use the updated pre-processors supporting case-insensitivity and curly quotes
    helper.addPreProcessor((text) => replaceFontColor(text));
    helper.addPreProcessor((text) => replaceFontBgColor(text));
  }
}
