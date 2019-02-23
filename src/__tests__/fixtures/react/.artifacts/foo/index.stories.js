import { createElement } from 'react';
import stories from 'stories';
stories.add('Story in foo/index.stories.ts', () => createElement('div', null, 'Hello'));
