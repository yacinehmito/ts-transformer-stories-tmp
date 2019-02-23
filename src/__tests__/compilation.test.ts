import { compile, extractArtifacts, DirectoryContent } from './utils/compile';

jest.setTimeout(15000);

expect.addSnapshotSerializer(DirectoryContent.getSnapshotSerializer());

test('The react projects compiles as expected', async () => {
  await compile('react');
  expect(await extractArtifacts('react')).toMatchSnapshot();
});
