"use strict";
var parseOptions = require("./parseOptions");
var ReactDOM     = require("./ReactDOM");

var domStyleParser = require("dom-style-parser");
var HandlebarsHtmlParser = require("handlebars-html-parser");



function compiler(options)
{
	this.options = options = parseOptions(options);
	
	this.parser = new HandlebarsHtmlParser(
	{
		normalizeWhitespace: options.normalizeWhitespace,
		processCSS:          options.processCSS,
		processJS:           options.processJS
	});
}



compiler.prototype.compile = function(str)
{
	var parserState;
	
	var compilerState = 
	{
		// React.DOM… or React.createElement per element in stack
		// Stack indexed by parent tag depth -- first index is a "document" node (root/top-level nodes container)
		areDomMethods: [false]
	};
	
	var options = this.options;
	var result = [];
	
	return this.parser.parse(str, function(node, state)
	{
		// Parent scope access
		parserState = state;
		
		switch (node.type)
		{
			case HandlebarsHtmlParser.type.HBS_EXPRESSION_END:
			{
				break;
			}
			case HandlebarsHtmlParser.type.HBS_EXPRESSION_START:
			{
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HBS_EXPRESSION_HASH_PARAM:
			{
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HBS_EXPRESSION_PARAM:
			{
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HBS_EXPRESSION_PATH:
			{
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HBS_TAG_END:
			{
				break;
			}
			case HandlebarsHtmlParser.type.HBS_TAG_START:
			{
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HTML_ATTR_END:
			{
				break;
			}
			case HandlebarsHtmlParser.type.HTML_ATTR_START:
			{
				if (numAttributes(parserState) <= 1)
				{
					if (isDomMethod(compilerState) === false)
					{
						// React.createElement("tag",
						result.push(",");
					}
					
					// React.createElement("tag", {
					// React.DOM.tag({
					result.push("{");
				}
				else
				{
					// React.createElement("tag", {attr:"value",
					// React.DOM.tag({attr:value,
					result.push(",");
				}
				
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HTML_ATTR_NAME_END:
			{
				break;
			}
			case HandlebarsHtmlParser.type.HTML_ATTR_NAME_START:
			{
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HTML_ATTR_VALUE_END:
			{
				break;
			}
			case HandlebarsHtmlParser.type.HTML_ATTR_VALUE_START:
			{
				result.push(":");
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HTML_COMMENT_END:
			{
				break;
			}
			case HandlebarsHtmlParser.type.HTML_COMMENT_START:
			{
				break;
			}
			
			
			// …>
			case HandlebarsHtmlParser.type.HTML_TAG_END:
			{
				if (parserState.isClosingTag === true)
				{
					if (numAttributes(parserState)>0 && numChildren(parserState)<=0)
					{
						result.push("}");
					}
					
					result.push(")");
					
					compilerState.areDomMethods.pop();
				}
				
				break;
			}
			// <…
			case HandlebarsHtmlParser.type.HTML_TAG_START:
			{
				if (parserState.isClosingTag === false)
				{
					compilerState.areDomMethods.push(false);
					
					beforeChild(parserState, compilerState, result, true);
					
					result.push("React.createElement(");
				}
				
				break;
			}
			
			
			case HandlebarsHtmlParser.type.HTML_TAG_NAME_END:
			{
				break;
			}
			case HandlebarsHtmlParser.type.HTML_TAG_NAME_START:
			{
				break;
			}
			
			
			case HandlebarsHtmlParser.type.TEXT:
			{
				if (parserState.isTag === true)
				{
					if (parserState.isTagName === true)
					{
						if (parserState.isClosingTag === false)
						{
							if (options.useDomMethods === true)
							{
								// If tag name has a `React.DOM` function
								if (ReactDOM[node.value] === true)
								{
									// Change stack's top value
									compilerState.areDomMethods[compilerState.areDomMethods.length-1] = true;
									
									// Change last/previous result index
									result[result.length-1] = "React.DOM." + node.value + "(";
									
									// Done -- no more code in this `case` will run
									break;
								}
							}
							
							// React.createElement("tag"
							result.push('"'+ node.value +'"');
						}
						// Else: closing tag name excluded from result
					}
					else if (parserState.isAttribute === true)
					{
						if (parserState.isAttributeName === true)
						{
							// React.createElement("tag", {"attr"
							// React.DOM.tag({"attr"
							result.push( transformAttributeName(node.value) );
						}
						else if (parserState.isAttributeValue === true)
						{
							// TODO :: support `href="javscript:code()"`
							/*if (parserState.isEventAttribute === true)
							{
								// React.createElement("tag", {"onsomething":"code()"
								// React.DOM.tag({"onsomething":"code()"
								result.push( transformScript(node.value, options) );
							}
							else*/ if (parserState.isStyleAttribute === true)
							{
								// React.createElement("tag", {"style":{…}
								// React.DOM.tag({"style":{…}
								result.push( transformInlineStyles(node.value, options) );
							}
							else
							{
								// React.createElement("tag", {"attr":"value"
								// React.DOM.tag({"attr":"value"
								result.push( safeString(node.value) );
							}
						}
					}
				}
				else
				{
					beforeChild(parserState, compilerState, result);
					
					if (parserState.isWithinScriptTag === true)
					{
						// React.createElement("script", …, "script()"
						// TODO :: only do so if mimetype is "text/javascript", "" or undefined
						result.push( transformScript(node.value, options) );
					}
					else if (parserState.isWithinStyleTag === true)
					{
						// React.createElement("style", …, "style:sheet"
						// TODO :: only do so if mimetype is "text/css", "" or undefined
						result.push( transformStylesheet(node.value, options) );
					}
					else
					{
						//if (typeof node.value==="string" || node.value instanceof String===true)
						//{
							// React.createElement("tag", …, "text"
							// React.DOM.tag(…, "text"
							result.push( safeString(node.value) );
						//}
						//else
						//{
							// Support for null, undefined, numbers
						//	result.push(node.value);
						//}
					}
				}
				
				break;
			}
			
			
			default:
			{
				// oops?
			}
		}
	}).then( function(program)
	{
		
		// If more than one top-level node
		if (numChildren(parserState) > 1)
		{
			if (options.multipleTopLevelNodes === true)
			{
				// Contain comma-separated list in an Array
				result.unshift("[");
				result.push("]");
			}
			else
			{
				throw new Error(numChildren(parserState) + " top-level nodes detected. Only 1 is currently supported by React.");
			}
		}
		
		//console.log(str);
		//console.log(program);
		//console.log(result);
		result = finalize(result, options);
		//console.log(result);
		
		return result;
	});
};



//::: PRIVATE FUNCTIONS



function beforeChild(parserState, compilerState, result, checkParent)
{
	var _isDomMethod   = checkParent!==true ? isDomMethod(compilerState) : isParentDomMethod(compilerState);
	var _numAttributes = checkParent!==true ? numAttributes(parserState) : numParentAttributes(parserState);
	var _numChildren   = checkParent!==true ? numChildren(parserState)   : numParentChildren(parserState);
	
	var _isTopLevelChild = checkParent!==true ? parserState.childCounts.length>1 : parserState.childCounts.length>2;
	
	if (_isTopLevelChild === true)
	{
		if (_numAttributes <= 0)
		{
			if (_numChildren <= 1)
			{
				if (_isDomMethod !== true)
				{
					// React.createElement("tag",
					result.push(",");
				}
				
				// React.createElement("tag", null,
				// React.DOM.tag(null,
				result.push("null");
				result.push(",");
			}
			else
			{
				// React.createElement("tag", {"attr":"value"}, sibling,
				// React.DOM.tag({"attr":"value"}, sibling,
				result.push(",");
			}
		}
		else
		{
			// React.createElement("tag", {"attr":"value"},
			// React.DOM.tag({"attr":"value"},
			result.push("}");
			result.push(",");
		}
	}
	// If top-level node with siblings
	else if (_numChildren > 1)
	{
		// React.createElement(…),
		// React.DOM.tag(…),
		// "text",
		result.push(",");
	}
}



function finalize(result, options)
{
	var js = options.prefix + result.join("") + options.suffix;
	
	// Check that the compiled code is valid
	try
	{
		Function("", js);
	}
	catch (error)
	{
		console.log(js);
		throw error;
	}
	
	if (options.beautify === true)
	{
		js = HandlebarsHtmlParser.beautifyJS(js);
	}
	
	return js;
}



function getLast(stack)
{
	return stack[stack.length - 1];
}



function getSecondLast(stack)
{
	return stack[stack.length - 2];
}



function isDomMethod(compilerState)
{
	return getLast(compilerState.areDomMethods);
}



function isParentDomMethod(compilerState)
{
	var result = getSecondLast(compilerState.areDomMethods);
	
	if (result === undefined) result = -1;
	
	return result;
}



function numAttributes(parserState)
{
	return getLast(parserState.attrCounts);
}



function numChildren(parserState)
{
	return getLast(parserState.childCounts);
}



function numParentAttributes(parserState)
{
	var result = getSecondLast(parserState.attrCounts);
	
	if (result === undefined) result = -1;
	
	return result;
}



function numParentChildren(parserState)
{
	var result = getSecondLast(parserState.childCounts);
	
	if (result === undefined) result = -1;
	
	return result;
}



function safeString(string)
{
	// Converts whitespace, unicode chars, adds/escapes quotes, etc
	return JSON.stringify(string);
}



function transformAttributeName(attrName)
{
	// TODO :: is this necessary?
	// TODO :: find a lib for this as there're more?
	switch (attrName)
	{
		case "class":
		{
			attrName = "className";
			break;
		}
		case "for":
		{
			attrName = "htmlFor";
			break;
		}
		default:
		{
			// TODO :: camel-case it?
		}
	}
	
	return '"'+ attrName +'"';
}



function transformInlineStyles(styles, options)
{
	// TODO :: autoprefix
	return JSON.stringify( domStyleParser(styles) );
}



function transformScript(script, options)
{
	// TODO :: uglify
	return safeString(script);
}



function transformStylesheet(stylesheet, options)
{
	// TODO :: autoprefix
	return safeString(stylesheet);
}



module.exports = compiler;