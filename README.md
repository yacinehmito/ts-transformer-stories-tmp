# ts-transformer-stories

**A TypeScript transformer to remove some of Storybook's boilerplate code.**

When you write Storybook stories, it often looks like this:

<!-- prettier-ignore-start -->
```tsx
// components/Button/index.stories.ts
import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Button } from './.';

storiesOf('components/Button', module)
  .add('Hello world!', () => (
    <Button onClick={() => alert('Hello world!')}>
      Hello world!
    </Button>
));
```
<!-- prettier-ignore-end -->

This is short and mostly declarative but two things could still be automated:

- Passing `module` to `storiesOf` is done to enable Hot Module Replacement on the stories. This cannot be factored out with functions because `module` is injected by webpack and relies on the file in which it is used, but we're still expected to write this code every time.
- The name of the kind (i.e. the group of stories, in our case `Components/Button`) can often be inferred from the location of the file. If you are maintaining a Storybook for your collection of components, chances are that they are all tightly organized and that you want the hierarchy of stories to match your hierarchy of files.

With ts-transformer-stories, you can turn the code above into this:

<!-- prettier-ignore-start -->
```tsx
// components/Button/index.stories.ts
import * as React from 'react';
import stories from 'stories';
import { Button } from './.';

stories.add('Hello world!', () => (
  <Button onClick={() => alert('Hello world!')}>
    Hello world!
  </Button>
));
```
<!-- prettier-ignore-end -->

You don't need to use `module` anymore, but still have the benefits of Hot Module Replacement.
Also, you don't need to give a name to the kind: it is automatically inferred from the location of the file. Here, it will be _components/Button_.

## Setup

### Installation

To add ts-transformer-stories to you Storybook, first install it with the following command:

```sh
npm install --dev ts-transformer-stories
```

Run `yarn add --dev ts-transformer-stories` instead if you are using yarn.

Then, in the `webpack.config.js` for Storybook, add the customer transformer to `awesome-typescript-loader`, as follows:

### Webpack configuration

```js
// webpack.config.js
const { storiesTransformer } = require('ts-transformer-stories');

module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: 'awesome-typescript-loader',
        options: {
          getCustomTransformers() {
            return { before: [storiesTransformer()] };
          },
        },
      },
    ],
  });
  config.resolve.extensions.push('.ts', '.tsx');
  return config;
};
```

By default, this will define a module called `stories` in all the files matching `*.stories.tsx?`.
The default export will be the result of `storiesOf(inferredKindName, module)`, where `storiesOf` originated from `@storybook/react` and `inferredKindName` is a string based on the file path.
Both are customizable, as described in the next section.

### Type safety

Chances are that the TypeScript integration of your editor of choices does not know about ts-transformer-stories, so it will not be able to resolve the module `stories`.
Instead of configuring it to allow for custom transformers, you can add a declaration file for it anywhere in your project.

For example, at the root of your project, add a file `stories.d.ts` with the following content:

```ts
declare module 'stories' {
  import { Story as Kind } from '@storybook/react';
  const stories: Kind;
  export default stories;
}
```

If you had previously installed `@types/storybook__react`, this will allow you to type-check your stories as if the module `stories` was statically defined.

The same thing can be done for other view libraries, such as Vue. See the folder [declarations](./declarations) for more examples.

## Configuration

To tweak the behavior of the transformer so that it suits your needs, you can provide an object to `storiesTransformer()` with the following properties:

| property          | type       | description                                                                               | default value                                                                                                                                                                          |
| ----------------- | ---------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storiesModule`   | `string`   | The name of the module that exports the kind                                              | `'stories'`                                                                                                                                                                            |
| `storybookModule` | `string`   | The module from with to import `storiesOf`; pick the right one for your view library      | `'@storybook/react'`                                                                                                                                                                   |
| `pathToKind`      | `Function` | A function that, given the path of the file, will return the name for the kind            | A function that removes the extension and suffix from the file path, then further removes the base name if it is `'index'` (this makes it roughly match the node resolution algorithm) |
| `unnamedKind`     | `string`   | The name of kinds for which `pathToKind()` returns an empty string                        | `'Unnamed'`                                                                                                                                                                            |
| `pattern`         | `RegExp`   | Identifies the files on which the transformer must be run                                 | `/\.stories\.tsx?$/`                                                                                                                                                                   |
| `rootDir`         | `string`   | The directory relative to which the file paths are set before being fed to `pathToKind()` | The current working directory                                                                                                                                                          |

## License

ts-transformer-stories is licensed under [MIT](LICENSE).

Copyright (c) 2019 Yacine Hmito
