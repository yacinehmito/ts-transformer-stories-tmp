import { compile, extractArtifacts } from './utils/compile';

jest.setTimeout(15000);

test('The react projects compiles as expected', async () => {
  await compile('react');
  expect(await extractArtifacts('react')).toMatchSnapshot();
});
