import { createElement } from 'react';
import stories from 'stories';

stories.add('Story in index.stories.ts', () =>
  createElement('div', null, 'Hello'),
);
