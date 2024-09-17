"use strict";
Object.defineProperty(exports, "__esModule", {
  value: !0,
}),
  (exports.stringifyFooter =
    exports.stringifyTree =
    exports.stringifyJSON =
    exports.stringifyModule =
    exports.polyfillString =
      void 0);

exports.polyfillString = `
local __ = {
	chunks = {},
	require = require, cache = {},
	scripts = {}
}

local function require(module)
	if typeof(module) == "Instance" then
		local name = __.scripts[module]
		if name then module = name end
	end
	if typeof(module) ~= "string" then
		return __.require(module)
	end

	local fn = __.chunks[module]
	if not fn then return end

	local cache = __.cache[module]
	if cache then return cache.value end

	local s, e = pcall(fn, __.scripts[module])
	if not s then return end

	__.cache[module] = { value = e }
	task.wait()
	return e
end

__.http = function()
	return game:GetService("HttpService")
end

__.json = function(str)
	return function() return __.http():JSONDecode(str) end
end

__.tree = function(str)
	local function recurse(t, parent)
		local pair, children = unpack(t)
		local name, link = unpack(pair)
		local proxy = Instance.new(link and "ModuleScript" or "Folder")
		proxy.Parent = parent
		proxy.Name = name
		if link then
			__.scripts[proxy] = link
			__.scripts[link] = proxy
		end
		for _, v in pairs(children) do recurse(v, proxy) end
		return proxy
	end
	recurse(__.http():JSONDecode(str))
end
`;
const stringifyModule = (e, r) =>
  `
	__.chunks[${e}] = function(script)
		${r ? "\n	" : ""}${r.trim()}
	end
	`;
exports.stringifyModule = stringifyModule;
const stringifyJSON = (e, r) => {
  let t = JSON.stringify(JSON.stringify(JSON.parse(r)));
  return `
	__.chunks[${e}] = __.json(${t})	
	`;
};
exports.stringifyJSON = stringifyJSON;
const stringifyTree = (e) => {
  let r = JSON.stringify(JSON.stringify(e));
  return `
	__.tree(${r})
	`;
};
exports.stringifyTree = stringifyTree;
const stringifyFooter = (e) => `return require("${e}")`;
exports.stringifyFooter = stringifyFooter;
