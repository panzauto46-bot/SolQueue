// Deploy script for SolQueue
const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
    anchor.setProvider(provider);
    console.log("🚀 SolQueue deployed to", provider.connection.rpcEndpoint);
};
