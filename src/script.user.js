// ==UserScript==
// @name               Youtube - Playlist searcher
// @namespace          https://greasyfork.org/users/821661
// @version            1.1.0
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

const matcher = {
    includes: value => data => data?.includes(value) ?? false,
    equals: value => data => data === value,
    type: value => (["music", "video"].includes(value) ? matcher.equals(value) : undefined),
};

const time = {
    UNITS: { h: 3600, m: 60, s: 1 },

    // "1:30:00", "10:30", "1h30m", "90s", "20" (número puro = minutos)
    seconds(text) {
        if (text.includes(":")) {
            const parts = text.split(":").map(Number);
            return parts.some(Number.isNaN) ? NaN : parts.reduce((total, part) => total * 60 + part, 0);
        }

        if (/^\d+(\.\d+)?$/.test(text)) return Number(text) * 60;
        if (!/^(\d+(\.\d+)?[hms])+$/.test(text)) return NaN;

        let total = 0;
        for (const [, amount, unit] of text.matchAll(/(\d+(?:\.\d+)?)([hms])/g)) {
            total += Number(amount) * time.UNITS[unit];
        }
        return total;
    },

    // ">10m", "<=5:00", "=90s", "5m-10m" -> função (segundos) => boolean
    compile(value) {
        const range = /^([^<>=-]+)-([^<>=-]+)$/.exec(value);
        let check;

        if (range) {
            const [min, max] = [time.seconds(range[1]), time.seconds(range[2])];
            if (Number.isNaN(min) || Number.isNaN(max)) return;
            check = seconds => seconds >= min && seconds <= max;
        } else {
            const [, op = "=", rest] = /^(>=|<=|>|<|=)?(.+)$/.exec(value);
            const limit = time.seconds(rest);
            if (Number.isNaN(limit)) return;

            check = {
                ">": seconds => seconds > limit,
                ">=": seconds => seconds >= limit,
                "<": seconds => seconds < limit,
                "<=": seconds => seconds <= limit,
                "=": seconds => seconds === limit,
            }[op];
        }

        return data => Number.isFinite(data) && check(data);
    },
};

const query = {
    ops: {
        text: { field: "text", compile: matcher.includes, re: /(?<!\S)text:("[^"]+"|\S+)/gi },
        title: { field: "title", compile: matcher.includes, re: /(?<!\S)title:("[^"]+"|\S+)/gi },
        channel: { field: "channel", compile: matcher.includes, re: /(?<!\S)channel:("[^"]+"|\S+)/gi },
        duration: { field: "duration", compile: time.compile, re: /(?<!\S)duration:("[^"]+"|\S+)/gi },
        type: { field: "type", compile: matcher.type, re: /(?<!\S)type:("[^"]+"|\S+)/gi },

        "exclude-text": { field: "text", compile: matcher.includes, negate: true, re: /(?<!\S)exclude-text:("[^"]+"|\S+)/gi },
        "exclude-title": { field: "title", compile: matcher.includes, negate: true, re: /(?<!\S)exclude-title:("[^"]+"|\S+)/gi },
        "exclude-channel": { field: "channel", compile: matcher.includes, negate: true, re: /(?<!\S)exclude-channel:("[^"]+"|\S+)/gi },
        "exclude-type": { field: "type", compile: matcher.type, negate: true, re: /(?<!\S)exclude-type:("[^"]+"|\S+)/gi },
    },

    parse(text) {
        const rules = [];
        let rest = text;

        for (const op of Object.values(this.ops)) {
            rest = rest.replace(op.re, (_, raw) => {
                const value = raw.replace(/^"|"$/g, "").toLowerCase();
                const match = op.compile(value);

                if (match) rules.push({ field: op.field, match, negate: Boolean(op.negate) });
                return "";
            });
        }

        rest = rest.trim().toLowerCase();
        if (rest) rules.push({ field: "text", match: matcher.includes(rest), negate: false });

        return rules;
    },
};

const view = {
    rules: undefined,
    cache: new WeakMap(),

    ITEM: [
        "ytd-browse[page-subtype='playlist'] ytd-two-column-browse-results-renderer[page-subtype='playlist'] ytd-playlist-video-renderer",
        "ytd-browse[page-subtype='playlist'] ytd-two-column-browse-results-renderer[page-subtype='playlist'] div:has(> yt-lockup-view-model .ytLockupViewModelHorizontal)",
    ].join(", "),

    items() {
        return document.querySelectorAll(this.ITEM);
    },

    data(item) {
        let data = this.cache.get(item);
        if (!data) {
            data = this.read(item);
            if (data.title) this.cache.set(item, data);
        }
        return data;
    },

    changed(records) {
        return records.some(({ type, target, addedNodes }) => {
            if (type === "attributes") return false;
            if (type === "characterData") return Boolean(target.parentElement?.closest(this.ITEM));

            return [...addedNodes].some(node =>
                node.nodeType === Node.ELEMENT_NODE &&
                (node.matches(this.ITEM) || node.closest(this.ITEM) || node.querySelector(this.ITEM)),
            );
        });
    },

    read(item) {
        const title = item.querySelector("#video-title, .ytLockupMetadataViewModelHeadingReset")?.textContent.trim().toLowerCase();
        const channel = item.querySelector("ytd-channel-name, .ytAttributedStringLinkCallToActionColor")?.textContent.trim().toLowerCase();
        const duration = item.querySelector("yt-thumbnail-badge-view-model")?.textContent.trim()
        const isMusic = !!item.querySelector("yt-thumbnail-badge-view-model svg path[d^='M5.5 1.383V6']")
        return {
            title,
            channel,
            text: [title, channel].filter(Boolean).join(" "),
            duration: duration ? time.seconds(duration) : undefined,
            type: isMusic ? "music" : "video",
        };
    },

    test(data, rules) {
        return rules.every(({ field, match, negate }) => {
            const found = match(data[field]);
            return negate ? !found : found;
        });
    },

    toggle(item, visible) {
        item.hidden = !visible;
    },

    filter(text) {
        this.apply(query.parse(text));
    },

    apply(rules, items = this.items()) {
        this.rules = rules;
        for (const item of items) this.toggle(item, this.test(this.data(item), rules));
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
        this.root ||= this.build();

        const playlistHeaderOwner = document.querySelector("ytd-browse[page-subtype='playlist'] :is(yt-item-section-renderer, ytd-item-section-renderer) #header");
        if (playlistHeaderOwner && !playlistHeaderOwner.querySelector(".psearch")) playlistHeaderOwner.prepend(this.root);
    },
};

watch.change((records) => {
    bar.mount();

    if (view.rules?.length && view.changed(records)) view.apply(view.rules);
});

document.addEventListener("yt-navigate-finish", (ev) => bar.mount());

GM_addStyle(`
    ytd-browse[page-subtype='playlist'] :is(yt-item-section-renderer, ytd-item-section-renderer) #header {
        display: flex;
    } 

    ytd-two-column-browse-results-renderer[page-subtype='playlist'] :is(yt-item-section-renderer, ytd-item-section-renderer) chip-bar-view-model .ytChipShapeChip {
        height: 37px;
    }

    #primary > .psearch {
        margin-left: 48px;
    }
    
    ytd-item-section-renderer[page-subtype="playlist"] .psearch {
        margin-left: 36px;
    }

    .psearch + div > chip-bar-view-model {
        margin-block: 12px;
    }

    .psearch + div, .psearch + chip-bar-view-model {
        margin-left: 12px !important;
    }

    .psearch + div {
        margin-bottom: 0px !important;
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