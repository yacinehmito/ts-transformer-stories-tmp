import { createElement } from 'react';
import stories from 'stories';

stories.add('Story in foo/bar/baz.stories.ts', () =>
  createElement('div', null, 'Hello'),
);
