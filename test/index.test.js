import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

import ContentsOutline from '../src/index.js';

const setDocument = (markup) => {
  const dom = new JSDOM(markup, { pretendToBeVisual: true });
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.NodeList = dom.window.NodeList;
  return dom.window.document;
};

const createOutline = (document, headings) => {
  ContentsOutline(
    document.querySelector('.contents-outline-container'),
    {
      headings: Array.from(document.querySelectorAll(headings)),
      moveToBefore1stHeading: false,
    }
  );
  return document.querySelector('.contents-outline');
};

test('treats native and ARIA headings with the same level equally', () => {
  const document = setDocument(`
    <div class="contents-outline-container"><div class="contents-outline"></div></div>
    <h2>Native level 2</h2>
    <div role="heading" aria-level="2">ARIA level 2</div>
    <h3>Native level 3</h3>
  `);
  const outline = createOutline(document, 'h2, [role="heading"], h3');

  const tree = outline.querySelector('ol');
  assert.equal(tree.children.length, 2);
  assert.equal(tree.children[0].textContent, 'Native level 2');
  assert.equal(tree.children[1].firstChild.textContent, 'ARIA level 2');
  assert.equal(tree.children[1].querySelector('ol > li').textContent, 'Native level 3');
});

test('assigns an ID to an ARIA heading using the existing convention', () => {
  const document = setDocument(`
    <div class="contents-outline-container"><div class="contents-outline"></div></div>
    <div role="heading" aria-level="2">ARIA heading</div>
  `);
  const outline = createOutline(document, '[role="heading"]');
  const heading = document.querySelector('[role="heading"]');

  assert.equal(heading.id, 'co-index-0');
  assert.equal(outline.querySelector('a').getAttribute('href'), '#co-index-0');
});

for (const ariaLevel of [ '0', '7', 'foo', null ]) {
  test(`does not treat an invalid aria-level (${ ariaLevel ?? 'missing' }) as an ARIA level`, () => {
    const ariaLevelAttribute = null === ariaLevel ? '' : ` aria-level="${ ariaLevel }"`;
    const document = setDocument(`
      <div class="contents-outline-container"><div class="contents-outline"></div></div>
      <h2>Native level 2</h2>
      <div role="heading"${ ariaLevelAttribute }>Invalid ARIA heading</div>
      <h3>Native level 3</h3>
    `);
    const outline = createOutline(document, 'h2, [role="heading"], h3');

    assert.equal(outline.querySelectorAll('ol').length, 1);
    assert.equal(outline.querySelector('ol').children.length, 3);
  });
}
