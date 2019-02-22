import { compile, extractArtifacts, DirectoryContent } from './compilation';

jest.setTimeout(15000);

expect.addSnapshotSerializer(DirectoryContent.getSnapshotSerializer());

test('The React project compiles as expected', async () => {
  await compile('react');
  expect(await extractArtifacts('react')).toMatchSnapshot();
});
