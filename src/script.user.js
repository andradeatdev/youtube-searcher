// ==UserScript==
// @name               Youtube - Playlist searcher
// @namespace          https://greasyfork.org/users/821661
// @version            1.0.0
// @description        Add search bar for playlist page
// @author             hdyzen
// @match              https://www.youtube.com/*
// @icon               https://www.google.com/s2/favicons?domain=youtube.com
// @grant              GM_addStyle
// @license            GPL-3.0
// ==/UserScript==

const element = {
    create(name, options = {}) {
        const node = document.createElement(name);
        return this.options(node, options);
    },

    createSVG(name, options = {}) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", name);
        return this.options(node, options);
    },

    options(node, options = {}) {
        const { attrs = {}, props = {}, events = {} } = options;

        for (const [name, value] of Object.entries(attrs)) {
            node.setAttribute(name, value);
        }

        for (const [name, value] of Object.entries(props)) {
            node[name] = value;
        }

        for (const [name, value] of Object.entries(events)) {
            node.addEventListener(name, value);
        }

        return node;
    }
};

const query = {
    ops: {
        text: { field: "text", re: /(?<!\S)text:("[^"]+"|\S+)/gi },
        title: { field: "title", re: /(?<!\S)title:("[^"]+"|\S+)/gi },
        channel: { field: "channel", re: /(?<!\S)channel:("[^"]+"|\S+)/gi },

        "exclude-text": { field: "text", re: /(?<!\S)exclude-text:("[^"]+"|\S+)/gi, negate: true },
        "exclude-title": { field: "title", re: /(?<!\S)exclude-title:("[^"]+"|\S+)/gi, negate: true },
        "exclude-channel": { field: "channel", re: /(?<!\S)exclude-channel:("[^"]+"|\S+)/gi, negate: true },
    },

    parse(text) {
        const rules = [];
        let rest = text;

        for (const op of Object.values(this.ops)) {
            rest = rest.replace(op.re, (_, value) => {
                rules.push({
                    field: op.field,
                    value: value.replace(/^"|"$/g, "").toLowerCase(),
                    negate: Boolean(op.negate),
                });
                return "";
            });
        }

        rest = rest.trim().toLowerCase();
        if (rest) rules.push({ field: "text", value: rest });

        return rules;
    },
};

const view = {
    rules: undefined,

    items() {
        return document.querySelectorAll("ytd-browse[page-subtype='playlist'] ytd-two-column-browse-results-renderer[page-subtype='playlist'] ytd-playlist-video-renderer");
    },

    read(item) {
        const title = item.querySelector("#video-title")?.textContent.trim().toLowerCase();
        const channel = item.querySelector("ytd-channel-name")?.textContent.trim().toLowerCase();
        return {
            title,
            channel,
            text: [title, channel].filter(Boolean).join(" "),
        };
    },

    test(data, rules) {
        return rules.every(({ field, value, negate }) => {
            const found = data[field]?.includes(value) ?? false;
            return negate ? !found : found;
        });
    },

    toggle(item, visible) {
        item.hidden = !visible;
    },

    filter(text) {
        this.apply(query.parse(text));
    },

    apply(rules) {
        this.rules = rules;
        for (const item of this.items()) this.toggle(item, this.test(this.read(item), rules));
    },
};

const watch = {
    OPTIONS: { childList: true, subtree: true, attributes: true, characterData: true },
    callbacks: new Set(),
    observer: undefined,
    queue: [],
    isScheduled: false,
    pending: new Set(),

    drain() {
        for (const record of this.observer.takeRecords()) this.queue.push(record);
    },

    flush() {
        this.isScheduled = false;
        this.drain();

        const records = this.queue;
        this.queue = [];
        if (records.length === 0) return;

        for (const callback of this.callbacks) {
            try {
                callback(records);
            } catch (error) {
                console.error(error);
            }
        }

        this.observer.takeRecords();
    },

    schedule() {
        if (this.isScheduled) return;
        this.isScheduled = true;
        requestAnimationFrame(() => this.flush());
    },

    observe() {
        if (this.observer) return;
        this.observer = new MutationObserver((records) => {
            for (const record of records) this.queue.push(record);
            this.schedule();
        });
        this.observer.observe(document.documentElement, this.OPTIONS);

        for (const root of this.pending) this.observer.observe(root, this.OPTIONS);
        this.pending.clear();
    },

    attach(root) {
        if (!this.observer) {
            this.pending.add(root);
            return;
        }

        this.observer.observe(root, this.OPTIONS);
        this.schedule();
    },

    change(callback) {
        this.observe();
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    },
};

const bar = {
    root: undefined,
    input: undefined,

    exec(text) {
        view.apply(query.parse(text));
    },

    reset() {
        this.input.value = "";
        this.exec("");
    },

    build() {
        const input = element.create("input", {
            props: { type: "search", placeholder: "Search in this playlist", ariaLabel: "Search in this playlist" },
            events: { input: ev => this.exec(ev.target.value) },
        });

        const clear = element.create("button", {
            props: { ariaLabel: "Clear search", textContent: "✕" },
            events: { click: () => this.reset() },
        });

        const root = element.create("div", { props: { className: "psearch", role: "search" } });
        root.append(this.icon(), input, clear);
        return root;
    },

    icon() {
        const svg = element.createSVG("svg", { attrs: { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round" } });
        const circle = element.createSVG("circle", { attrs: { cx: 11, cy: 11, r: 7 } });
        const path = element.createSVG("path", { attrs: { d: "m20 20-3.5-3.5" } });
        svg.append(circle, path);
        return svg;
    },

    mount() {
        const header = document.querySelector("ytd-section-list-renderer[page-subtype='playlist'] ytd-item-section-renderer > #header");
        if (!header || header.querySelector(".psearch")) return;

        this.root ||= this.build();
        header.append(this.root);
    },
};

watch.change(() => bar.mount());

GM_addStyle(`
    ytd-section-list-renderer[page-subtype='playlist'] ytd-item-section-renderer #header {
        display: flex;
    }    

    ytd-section-list-renderer[page-subtype='playlist'] ytd-item-section-renderer chip-bar-view-model {
        width: max-content;
    }

    ytd-section-list-renderer[page-subtype='playlist'] ytd-item-section-renderer chip-bar-view-model .ytChipShapeChip {
        height: 37px;
    }

    .psearch {
        flex: 1;
        min-width: 220px;
        max-width: 420px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #1f1f1f;
        border: 1px solid #3a3a3a;
        border-radius: 20px;
        padding: 0 6px 0 14px;
        margin-block: 12px;
        transition: border-color .15s;
    }

    .psearch:focus-within {
        border-color: #3ea6ff;
    }

    .psearch svg {
	    flex: none;
	    color: #aaa;
    }

    .psearch input {
        flex: 1;
        min-width: 0;
        background: transparent;
        border: 0;
        outline: 0;
        color: #f1f1f1;
        font-size: 14px;
        padding: 9px 0;
    }

    .psearch input:not(:placeholder-shown) + button {
        visibility: visible;
    }

    .psearch button {
        border: 0;
        background: transparent;
        color: #aaa;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        visibility: hidden;
    }
`);