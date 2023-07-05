import { awscdk } from 'projen';

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'cachemonet',
  authorAddress: 'noneya@business.com',
  cdkVersion: '2.86.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.0.0',
  name: 'proxyable-nodejs-function',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/gaslimitreached/proxyable-nodejs-function.git',
});

project.synth();
