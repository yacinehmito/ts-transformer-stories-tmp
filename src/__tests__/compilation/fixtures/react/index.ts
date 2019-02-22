// This file should not go through the transformer
import { createElement } from 'react';
import stories from 'stories';

stories.add('Story in index.ts', () => createElement('div', null, 'Hello'));
