import { createElement } from 'react';
import stories from 'stories';

stories.add('Story in foo/foo.stories.ts', () =>
  createElement('div', null, 'Hello'),
);
