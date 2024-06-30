import puppeteer, {
  Browser,
  ClickOptions,
  ElementHandle,
  EvaluateFunc,
  GoToOptions,
  HTTPResponse,
  KeyboardTypeOptions,
  KeyInput,
  KeyPressOptions,
  Page,
  PuppeteerLaunchOptions,
  QueryOptions,
  WaitForOptions,
  WaitForSelectorOptions
} from 'puppeteer-core';
import { from, map, Observable, switchMap } from 'rxjs';

export const puppeteerWrapper = (
  options?: PuppeteerLaunchOptions
): Observable<BrowserWrapper> => {
  return from(puppeteer.launch(options)).pipe(
    map((browser) => new BrowserWrapper(browser))
  );
};

export class BrowserWrapper {
  constructor(private browser: Browser) {}

  newPage(): Observable<PageWrapper> {
    return from(this.browser.newPage()).pipe(
      map((page) => new PageWrapper(page))
    );
  }

  close(): Observable<void> {
    return from(this.browser.close());
  }
}

export class PageWrapper {
  constructor(private page: Page) {}

  $$(
    selector: string,
    options?: QueryOptions
  ): Observable<ElementHandleWrapper<Element>> {
    return from(this.page.$$(selector, options)).pipe(
      switchMap((res) => res.map((handle) => new ElementHandleWrapper(handle)))
    );
  }

  $(selector: string): Observable<ElementHandleWrapper<Element> | null> {
    return from(this.page.$(selector)).pipe(
      map((res) => (res ? new ElementHandleWrapper(res) : null))
    );
  }

  goto(url: string, options?: GoToOptions): Observable<HTTPResponse | null> {
    return from(this.page.goto(url, options)).pipe(map((res) => res));
  }

  waitForSelector(
    selector: string,
    options?: WaitForSelectorOptions
  ): Observable<ElementHandleWrapper<Element> | null> {
    return from(this.page.waitForSelector(selector, options)).pipe(
      map((res) => (res ? new ElementHandleWrapper(res) : null))
    );
  }

  waitForNavigation(options?: WaitForOptions): Observable<HTTPResponse | null> {
    return from(this.page.waitForNavigation(options)).pipe(map((res) => res));
  }

  reload(options?: WaitForOptions): Observable<HTTPResponse | null> {
    return from(this.page.reload(options)).pipe(map((res) => res));
  }

  evaluate<Params extends unknown[], Func extends EvaluateFunc<Params>>(
    pageFunction: Func | string,
    ...args: Params
  ) {
    return from(this.page.evaluate(pageFunction));
  }
}

export class ElementHandleWrapper<ElementType extends Element> {
  constructor(private handle: ElementHandle<ElementType>) {}

  click(options?: Readonly<ClickOptions>): Observable<void> {
    return from(this.handle.click(options));
  }

  type(
    text: string,
    options?: Readonly<KeyboardTypeOptions>
  ): Observable<void> {
    return from(this.handle.type(text, options));
  }

  press(key: KeyInput, options?: Readonly<KeyPressOptions>) {
    return from(this.handle.press(key, options));
  }

  jsonValue() {
    return from(this.handle.jsonValue());
  }
}
