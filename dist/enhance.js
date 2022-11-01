var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// morph.mjs
var ELEMENT_NODE = 1;
var DOCUMENT_FRAGMENT_NODE = 11;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
var NS_XHTML = "http://www.w3.org/1999/xhtml";
function noop() {
}
__name(noop, "noop");
function morphAttrs(fromNode, toNode) {
  const toNodeAttrs = toNode.attributes;
  let attr;
  let attrName;
  let attrNamespaceURI;
  let attrValue;
  let fromValue;
  if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE || fromNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  for (let i = toNodeAttrs.length - 1; i >= 0; i--) {
    attr = toNodeAttrs[i];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    attrValue = attr.value;
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);
      if (fromValue !== attrValue) {
        if (attr.prefix === "xmlns") {
          attrName = attr.name;
        }
        fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
      }
    } else {
      fromValue = fromNode.getAttribute(attrName);
      if (fromValue !== attrValue) {
        fromNode.setAttribute(attrName, attrValue);
      }
    }
  }
  const fromNodeAttrs = fromNode.attributes;
  for (let d = fromNodeAttrs.length - 1; d >= 0; d--) {
    attr = fromNodeAttrs[d];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
        fromNode.removeAttributeNS(attrNamespaceURI, attrName);
      }
    } else {
      if (!toNode.hasAttribute(attrName)) {
        fromNode.removeAttribute(attrName);
      }
    }
  }
}
__name(morphAttrs, "morphAttrs");
var doc = typeof document === "undefined" ? void 0 : document;
function toElement(str) {
  str = str.trim();
  const html = new DOMParser().parseFromString(str, "text/html");
  return html.body.firstChild;
}
__name(toElement, "toElement");
function compareNodeNames(fromEl, toEl) {
  const fromNodeName = fromEl.nodeName;
  const toNodeName = toEl.nodeName;
  let fromCodeStart;
  let toCodeStart;
  if (fromNodeName === toNodeName) {
    return true;
  }
  fromCodeStart = fromNodeName.charCodeAt(0);
  toCodeStart = toNodeName.charCodeAt(0);
  if (fromCodeStart <= 90 && toCodeStart >= 97) {
    return fromNodeName === toNodeName.toUpperCase();
  } else if (toCodeStart <= 90 && fromCodeStart >= 97) {
    return toNodeName === fromNodeName.toUpperCase();
  } else {
    return false;
  }
}
__name(compareNodeNames, "compareNodeNames");
function createElementNS(name, namespaceURI) {
  return !namespaceURI || namespaceURI === NS_XHTML ? doc.createElement(name) : doc.createElementNS(namespaceURI, name);
}
__name(createElementNS, "createElementNS");
function moveChildren(fromEl, toEl) {
  let curChild = fromEl.firstChild;
  while (curChild) {
    var nextChild = curChild.nextSibling;
    toEl.appendChild(curChild);
    curChild = nextChild;
  }
  return toEl;
}
__name(moveChildren, "moveChildren");
function syncBooleanAttrProp(fromEl, toEl, name) {
  if (fromEl[name] !== toEl[name]) {
    fromEl[name] = toEl[name];
    if (fromEl[name]) {
      fromEl.setAttribute(name, "");
    } else {
      fromEl.removeAttribute(name);
    }
  }
}
__name(syncBooleanAttrProp, "syncBooleanAttrProp");
var specialElHandlers = {
  OPTION: function(fromEl, toEl) {
    let parentNode = fromEl.parentNode;
    if (parentNode) {
      let parentName = parentNode.nodeName.toUpperCase();
      if (parentName === "OPTGROUP") {
        parentNode = parentNode.parentNode;
        parentName = parentNode && parentNode.nodeName.toUpperCase();
      }
      if (parentName === "SELECT" && !parentNode.hasAttribute("multiple")) {
        if (fromEl.hasAttribute("selected") && !toEl.selected) {
          fromEl.setAttribute("selected", "selected");
          fromEl.removeAttribute("selected");
        }
        parentNode.selectedIndex = -1;
      }
    }
    syncBooleanAttrProp(fromEl, toEl, "selected");
  },
  INPUT: function(fromEl, toEl) {
    syncBooleanAttrProp(fromEl, toEl, "checked");
    syncBooleanAttrProp(fromEl, toEl, "disabled");
    if (fromEl.value !== toEl.value) {
      fromEl.value = toEl.value;
    }
    if (!toEl.hasAttribute("value")) {
      fromEl.removeAttribute("value");
    }
  },
  TEXTAREA: function(fromEl, toEl) {
    const newValue = toEl.value;
    if (fromEl.value !== newValue) {
      fromEl.value = newValue;
    }
    const firstChild = fromEl.firstChild;
    if (firstChild) {
      const oldValue = firstChild.nodeValue;
      if (oldValue == newValue || !newValue && oldValue == fromEl.placeholder) {
        return;
      }
      firstChild.nodeValue = newValue;
    }
  },
  SELECT: function(fromEl, toEl) {
    if (!toEl.hasAttribute("multiple")) {
      let selectedIndex = -1;
      let i = 0;
      let curChild = fromEl.firstChild;
      let optgroup;
      let nodeName;
      while (curChild) {
        nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
        if (nodeName === "OPTGROUP") {
          optgroup = curChild;
          curChild = optgroup.firstChild;
        } else {
          if (nodeName === "OPTION") {
            if (curChild.hasAttribute("selected")) {
              selectedIndex = i;
              break;
            }
            i++;
          }
          curChild = curChild.nextSibling;
          if (!curChild && optgroup) {
            curChild = optgroup.nextSibling;
            optgroup = null;
          }
        }
      }
      fromEl.selectedIndex = selectedIndex;
    }
  }
};
function defaultGetNodeKey(node) {
  if (node) {
    return node.getAttribute && node.getAttribute("id") || node.id;
  }
}
__name(defaultGetNodeKey, "defaultGetNodeKey");
function morphdomFactory(morphAttrs2) {
  return /* @__PURE__ */ __name(function morphdom(fromNode, toNode, options) {
    if (!options) {
      options = {};
    }
    if (typeof toNode === "string") {
      if (fromNode.nodeName === "#document" || fromNode.nodeName === "HTML" || fromNode.nodeName === "BODY") {
        const toNodeHtml = toNode;
        toNode = doc.createElement("html");
        toNode.innerHTML = toNodeHtml;
      } else {
        toNode = toElement(toNode);
      }
    } else if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
      toNode = toNode.firstElementChild;
    }
    const getNodeKey = options.getNodeKey || defaultGetNodeKey;
    const onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
    const onNodeAdded = options.onNodeAdded || noop;
    const onBeforeElUpdated = options.onBeforeElUpdated || noop;
    const onElUpdated = options.onElUpdated || noop;
    const onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
    const onNodeDiscarded = options.onNodeDiscarded || noop;
    const onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
    const childrenOnly = options.childrenOnly === true;
    const fromNodesLookup = /* @__PURE__ */ Object.create(null);
    const keyedRemovalList = [];
    function addKeyedRemoval(key) {
      keyedRemovalList.push(key);
    }
    __name(addKeyedRemoval, "addKeyedRemoval");
    function walkDiscardedChildNodes(node, skipKeyedNodes) {
      if (node.nodeType === ELEMENT_NODE) {
        let curChild = node.firstChild;
        while (curChild) {
          let key = void 0;
          if (skipKeyedNodes && (key = getNodeKey(curChild))) {
            addKeyedRemoval(key);
          } else {
            onNodeDiscarded(curChild);
            if (curChild.firstChild) {
              walkDiscardedChildNodes(curChild, skipKeyedNodes);
            }
          }
          curChild = curChild.nextSibling;
        }
      }
    }
    __name(walkDiscardedChildNodes, "walkDiscardedChildNodes");
    function removeNode(node, parentNode, skipKeyedNodes) {
      if (onBeforeNodeDiscarded(node) === false) {
        return;
      }
      if (parentNode) {
        parentNode.removeChild(node);
      }
      onNodeDiscarded(node);
      walkDiscardedChildNodes(node, skipKeyedNodes);
    }
    __name(removeNode, "removeNode");
    function indexTree(node) {
      if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        let curChild = node.firstChild;
        while (curChild) {
          const key = getNodeKey(curChild);
          if (key) {
            fromNodesLookup[key] = curChild;
          }
          indexTree(curChild);
          curChild = curChild.nextSibling;
        }
      }
    }
    __name(indexTree, "indexTree");
    indexTree(fromNode);
    function handleNodeAdded(el) {
      onNodeAdded(el);
      let curChild = el.firstChild;
      while (curChild) {
        const nextSibling = curChild.nextSibling;
        const key = getNodeKey(curChild);
        if (key) {
          const unmatchedFromEl = fromNodesLookup[key];
          if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
            curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
            morphEl(unmatchedFromEl, curChild);
          } else {
            handleNodeAdded(curChild);
          }
        } else {
          handleNodeAdded(curChild);
        }
        curChild = nextSibling;
      }
    }
    __name(handleNodeAdded, "handleNodeAdded");
    function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
      while (curFromNodeChild) {
        var fromNextSibling = curFromNodeChild.nextSibling;
        if (curFromNodeKey = getNodeKey(curFromNodeChild)) {
          addKeyedRemoval(curFromNodeKey);
        } else {
          removeNode(curFromNodeChild, fromEl, true);
        }
        curFromNodeChild = fromNextSibling;
      }
    }
    __name(cleanupFromEl, "cleanupFromEl");
    function morphEl(fromEl, toEl, childrenOnly2) {
      const toElKey = getNodeKey(toEl);
      if (toElKey) {
        delete fromNodesLookup[toElKey];
      }
      if (!childrenOnly2) {
        if (onBeforeElUpdated(fromEl, toEl) === false) {
          return;
        }
        morphAttrs2(fromEl, toEl);
        onElUpdated(fromEl);
        if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
          return;
        }
      }
      if (fromEl.nodeName !== "TEXTAREA") {
        morphChildren(fromEl, toEl);
      } else {
        specialElHandlers.TEXTAREA(fromEl, toEl);
      }
    }
    __name(morphEl, "morphEl");
    function morphChildren(fromEl, toEl) {
      let curToNodeChild = toEl.firstChild;
      let curFromNodeChild = fromEl.firstChild;
      let curToNodeKey;
      let curFromNodeKey;
      let fromNextSibling;
      let toNextSibling;
      let matchingFromEl;
      outer:
        while (curToNodeChild) {
          toNextSibling = curToNodeChild.nextSibling;
          curToNodeKey = getNodeKey(curToNodeChild);
          while (curFromNodeChild) {
            fromNextSibling = curFromNodeChild.nextSibling;
            if (curToNodeChild === curFromNodeChild) {
              curToNodeChild = toNextSibling;
              curFromNodeChild = fromNextSibling;
              continue outer;
            }
            curFromNodeKey = getNodeKey(curFromNodeChild);
            var curFromNodeType = curFromNodeChild.nodeType;
            var isCompatible = void 0;
            if (curFromNodeType === curToNodeChild.nodeType) {
              if (curFromNodeType === ELEMENT_NODE) {
                if (curToNodeKey) {
                  if (curToNodeKey !== curFromNodeKey) {
                    if (matchingFromEl = fromNodesLookup[curToNodeKey]) {
                      if (fromNextSibling === matchingFromEl) {
                        isCompatible = false;
                      } else {
                        fromEl.insertBefore(matchingFromEl, curFromNodeChild);
                        if (curFromNodeKey) {
                          addKeyedRemoval(curFromNodeKey);
                        } else {
                          removeNode(curFromNodeChild, fromEl, true);
                        }
                        curFromNodeChild = matchingFromEl;
                      }
                    } else {
                      isCompatible = false;
                    }
                  }
                } else if (curFromNodeKey) {
                  isCompatible = false;
                }
                isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                if (isCompatible) {
                  morphEl(curFromNodeChild, curToNodeChild);
                }
              } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                isCompatible = true;
                if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
                  curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                }
              }
            }
            if (isCompatible) {
              curToNodeChild = toNextSibling;
              curFromNodeChild = fromNextSibling;
              continue outer;
            }
            if (curFromNodeKey) {
              addKeyedRemoval(curFromNodeKey);
            } else {
              removeNode(curFromNodeChild, fromEl, true);
            }
            curFromNodeChild = fromNextSibling;
          }
          if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
            fromEl.appendChild(matchingFromEl);
            morphEl(matchingFromEl, curToNodeChild);
          } else {
            const onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
            if (onBeforeNodeAddedResult !== false) {
              if (onBeforeNodeAddedResult) {
                curToNodeChild = onBeforeNodeAddedResult;
              }
              if (curToNodeChild.actualize) {
                curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
              }
              fromEl.appendChild(curToNodeChild);
              handleNodeAdded(curToNodeChild);
            }
          }
          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
        }
      cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);
      const specialElHandler = specialElHandlers[fromEl.nodeName];
      if (specialElHandler) {
        specialElHandler(fromEl, toEl);
      }
    }
    __name(morphChildren, "morphChildren");
    let morphedNode = fromNode;
    const morphedNodeType = morphedNode.nodeType;
    const toNodeType = toNode.nodeType;
    if (!childrenOnly) {
      if (morphedNodeType === ELEMENT_NODE) {
        if (toNodeType === ELEMENT_NODE) {
          if (!compareNodeNames(fromNode, toNode)) {
            onNodeDiscarded(fromNode);
            morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
          }
        } else {
          morphedNode = toNode;
        }
      } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) {
        if (toNodeType === morphedNodeType) {
          if (morphedNode.nodeValue !== toNode.nodeValue) {
            morphedNode.nodeValue = toNode.nodeValue;
          }
          return morphedNode;
        } else {
          morphedNode = toNode;
        }
      }
    }
    if (morphedNode === toNode) {
      onNodeDiscarded(fromNode);
    } else {
      if (toNode === morphedNode) {
        return;
      }
      morphEl(morphedNode, toNode, childrenOnly);
      if (keyedRemovalList) {
        for (let i = 0, len = keyedRemovalList.length; i < len; i++) {
          const elToRemove = fromNodesLookup[keyedRemovalList[i]];
          if (elToRemove) {
            removeNode(elToRemove, elToRemove.parentNode, false);
          }
        }
      }
    }
    if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
      if (morphedNode.actualize) {
        morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
      }
      fromNode.parentNode.replaceChild(morphedNode, fromNode);
    }
    return morphedNode;
  }, "morphdom");
}
__name(morphdomFactory, "morphdomFactory");
var morph = morphdomFactory(morphAttrs);
var morph_default = morph;

// index.mjs
function enhance(tagName, opts) {
  const shadow = opts.shadow;
  const _observedAttributes = opts.observedAttributes || opts.attrs;
  delete opts.observedAttributes;
  delete opts.attrs;
  const _adoptedCallback = opts.adoptedCallback || opts.adopted;
  delete opts.adoptedCallback;
  delete opts.adopted;
  const _connectedCallback = opts.connectedCallback || opts.connected;
  delete opts.connectedCallback;
  delete opts.connected;
  const _disconnectedCallback = opts.disconnectedCallback || opts.disconnected;
  delete opts.disconnectedCallback;
  delete opts.disconnected;
  class EnhanceElement extends HTMLElement {
    constructor() {
      super();
      Object.keys(opts).map(
        (k) => Object.defineProperty(this, k, {
          value: opts[k],
          writable: false
        })
      );
      if (shadow) {
        this.shadowMode = shadow;
      }
      const templateName = `${this.tagName.toLowerCase()}-template`;
      const template = document.getElementById(templateName);
      if (template) {
        this.template = template;
      } else {
        this.template = document.createElement("template");
        this.template.innerHTML = this.render({
          html: this.html,
          state: { attrs: {}, store: {} }
        });
        this.template.setAttribute("id", templateName);
      }
      this.shadowMode ? this.attachShadow({ mode: this.shadowMode || "open" }).appendChild(this.template.content.cloneNode(true)) : this.replaceChildren(
        this.template.content.cloneNode(true)
      );
      this.store = {};
      this.init(this);
    }
    static get observedAttributes() {
      return _observedAttributes;
    }
    adoptedCallback() {
      if (typeof _adoptedCallback === "function") {
        _adoptedCallback.call(this);
      }
    }
    connectedCallback() {
      if (this.isConnected && typeof _connectedCallback === "function") {
        _connectedCallback.call(this);
      }
    }
    disconnectedCallback() {
      if (typeof _disconnectedCallback === "function") {
        _disconnectedCallback.call(this);
      }
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this.#process();
      }
    }
    html(strings, ...values) {
      const collect = [];
      for (let i = 0; i < strings.length - 1; i++) {
        collect.push(strings[i], values[i]);
      }
      collect.push(strings[strings.length - 1]);
      return collect.join("");
    }
    get #state() {
      const attrs = this.attributes.length ? this.attrsToObject(this.attributes) : {};
      const store = this.store;
      return {
        attrs,
        store
      };
    }
    attrsToObject(attrs = []) {
      const attrsObj = {};
      for (let d = attrs.length - 1; d >= 0; d--) {
        let attr = attrs[d];
        attrsObj[attr.nodeName] = attr.nodeValue;
      }
      return attrsObj;
    }
    #process() {
      const tmp = this.render({
        html: this.html,
        state: this.#state
      });
      const updated = document.createElement("div");
      updated.innerHTML = tmp.trim();
      morph_default(
        this,
        updated,
        {
          childrenOnly: true
        }
      );
    }
  }
  __name(EnhanceElement, "EnhanceElement");
  customElements.define(
    tagName,
    EnhanceElement
  );
}
__name(enhance, "enhance");
export {
  enhance as default
};
