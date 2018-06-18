import * as React from "react";
import throttle = require("lodash.throttle");

export interface StayVisibleProps {
  side: "top" | "bottom";
  offset: number;
  scrollable?: HTMLElement;
}

export default class StayVisible extends React.Component<StayVisibleProps> {
  private node: HTMLElement | null = null;

  private observer: MutationObserver | null = null;

  public componentDidMount() {
    if (!this.node) {
      throw new Error("Component did not mount");
    }

    this.subscribeEventListener(this.node);
  }

  public componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  public render() {
    return <div ref={_ => (this.node = _)}>{this.props.children}</div>;
  }

  private subscribeEventListener(node: HTMLElement) {
    const mutationHandler = throttle(this.handleMutation, 300);

    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutationHandler);
    });

    this.observer.observe(node, {
      childList: true,
      characterData: true,
      attributes: true,
      subtree: true
    });
  }

  private handleMutation = () => {
    if (!this.node) {
      return;
    }

    const rect = this.node.getBoundingClientRect();
    const windowBottom = window.innerHeight;
    const scrollable =
      this.props.scrollable || findScrollableParent(this.node!);
    if (!scrollable) {
      return;
    }
    if (this.props.side === "bottom") {
      if (rect.bottom > windowBottom - this.props.offset) {
        scrollable.scrollTo({
          behavior: "smooth",
          top: scrollable.scrollTop + rect.bottom
        });
      }
    }
    if (this.props.side === "top") {
      if (rect.top < this.props.offset) {
        scrollable.scrollTo({ behavior: "smooth", top: rect.top });
      }
    }
  };
}

function findScrollableParent(el: HTMLElement): HTMLElement {
  let isDocumentElement: boolean | null | undefined;
  let hasScrollableSpace: boolean | null | undefined;
  let hasVisibleOverflow: boolean | null | undefined;
  let currentElement: HTMLElement = el;
  do {
    if (
      currentElement.parentElement == null ||
      !(currentElement.parentElement instanceof HTMLElement)
    ) {
      return document.documentElement;
    }
    currentElement = currentElement.parentElement;
    isDocumentElement = currentElement === document.documentElement;
    hasScrollableSpace =
      currentElement.clientHeight < currentElement.scrollHeight ||
      currentElement.clientWidth < currentElement.scrollWidth;
    hasVisibleOverflow =
      window.getComputedStyle(currentElement).overflow === "visible";
  } while (!isDocumentElement && !(hasScrollableSpace && !hasVisibleOverflow));

  isDocumentElement = null;
  hasScrollableSpace = null;
  hasVisibleOverflow = null;

  return currentElement;
}
