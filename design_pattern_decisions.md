# Approve/TransferFrom
We use the approve/transferFrom pattern for the StableToken (ERC20) because the GiftCertificate (ERC721) contract needs to be aware that its balance of ERC20 tokens has changed. The only way that it can 'know' this is by initiating the transfer from the ERC721 in stead of directly sending ERC20 to the address of ERC721 which would only change state on the ERC20 contract (not the ERC721 contract).

# SafeTransferFrom for GiftCertificate (ERC721)
We use the Safe version of the transferFrom for GiftCertificate This makes sure that wherever the GiftCertificate is either an external account or  a contract which is able to handle ERC721 tokens (by virtue of the checkOnERC721Received() function.

We do not use the safe version for the ERC20 contract as it is not part of the ERC20 standard and a lot of existing ERC20 tokens (for example DAI) doe snot have an ERC0 equivalent mechanism. So if we would add this to our ERC20 contract the GiftCertificate contract would not be  compatible with existing ERC20 tokens.

# Circuit Breaker / State Machine
The GiftCertificate contract is pausable, which acts as a circuit breaker. When the contract is paused, users can get their Stable tokens back. Only when all GiftCertificates are refunded can the owner of the contract get the remaining Stable tokens back.

# Restricting Access
We use 2 distinct roles (plus no role for ordinary users).
- Owner
- Shop

Under normal operation of the contract:
- The owner can add a shop, fund and pause the contract.
- Only a shop can redeem the GiftCertificates.

When the contract is Paused:
- Anyone holding GiftCertificates can redeem the token for the allocated Stable tokens.
- The owner can retrieve the remaining Stable tokens when all GiftCertificates have been refunded.


# Unrealized
Following initial ideas have not been realized either due to technical issues or time constraints:

- Use of ENS to resolve an URL to the IPFS hosted application: ENS is deployed on Mainnet (.eth), Ropsten (.test) and Rinkeby (.test). Although the application is [registered](https://rinkeby.etherscan.io/tx/0x079396ed1147d6fad6603ebcb5a8e4e3cc0cea0be7f2b96d2affebc123e50e8a] with ENS on Rinkeby (giftcertificates.test), MetaMask only [supports](https://github.com/MetaMask/metamask-extension/blob/42e67295f4ea88380a452e5872d155f1185ba422/app/scripts/lib/ens-ipfs/setup.js#L9) redirecting an .eth domain (for Mainnet), but not .test domains (for Ropsten or Rinkeby).
- Time component : every GiftCertificate would have an expiration date. Once that certificate expired a user would be able to get their initial investment back, but the bonus would stay in the contract. This would account for a scenario where no  or not enough shops were participating anymore.
- blocking shops from buying GiftCertificates: in the current setup a shop can buy a GiftCertificate and immediatly redeem the certificate for a 10% bonus. As it doesn't make any sense to block this using roles (a shop owner could just use another address to buy GiftCertificates) it is clear another solution should be devised. In the most simple use case however where the promoter and the shop are the same entity, or at least have a strong relationship this would not be an issue.
