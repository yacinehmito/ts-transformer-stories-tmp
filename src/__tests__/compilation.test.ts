import { compile, extractArtifacts } from './utils/compile';

test('The react projects compiles as expected', async () => {
  await compile('react');
  expect(await extractArtifacts('react')).toMatchSnapshot();
});
