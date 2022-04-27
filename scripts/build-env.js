const fs = require('fs');
const commander = require('commander');
const program = new commander.Command();

program
    .option('--eth <eth-prc>')
    .option('--polygon <polygon-rpc>')
    .parse();

const options = program.opts();

if (!options.eth || !options.polygon) {
    throw new Error('You must pass providers for all networks.');
}

const config = `
global.sdkEnv = {
    providers: {
        ETH: {
            jsonRpcUrl: '${options.eth}',
            blockNumber: 13961175
        },
        POLYGON: {
            jsonRpcUrl: '${options.polygon}',
            blockNumber: 23571568
        }
    }
}
`;

fs.writeFileSync('./__tests__/env.js', config);
