import React, { Component } from "react";
import StableTokenContract from "./contracts/StableToken.json";
import GiftCertificateContract from "./contracts/GiftCertificate.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";

import "./App.css";

class App extends Component {
  state = { web3: null, is_paused: false, is_shop: false, decimals: 18, stbl_total_supply: 0, stble_my_supply: 0, gft_stbl_balance: 0, gft_total_supply: 0, gft_my_supply: 0, gft_contract_owner: null, current_network: "", current_account: null, accounts: null, stbl_contract: null, gft_contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      //Get the current account
      var current_account = null;
      var id = 0;
      if (window.ethereum) {
        //Metamask specific property
        //selectedAddress returns all lower case address, while accounts[0] and owner() return mixed case .
        current_account = web3.utils.toChecksumAddress(await window.ethereum.selectedAddress);
        //id = await window.ethereum.networkVersion;
        id =  await web3.eth.net.getId();
      } else {
        current_account = web3.utils.toChecksumAddress(accounts[0]);
        id =  await web3.eth.net.getId();
      }
      const network = {'1': 'Main Net', '2': 'Morden', '3': 'Ropsten', '4': 'Rinkeby', '42': 'Kovan'}
      let network_name;
      if (network[id] !== undefined) {
        network_name = network[id];
      } else {
        network_name = "Custom network, id: " + id;
      }

      // Get the STBL contract instance.
      const StblContract = truffleContract(StableTokenContract);
      StblContract.setProvider(web3.currentProvider);
      const stbl_instance = await StblContract.deployed();
      const decimals = (await stbl_instance.decimals()).toNumber()


      // Get the GFT contract instance.
      const GftContract = truffleContract(GiftCertificateContract);
      GftContract.setProvider(web3.currentProvider);
      const gft_instance = await GftContract.deployed();
      const gft_contract_owner = await gft_instance.owner();
      const is_paused = (await gft_instance.paused())
      await this.setState({web3: web3, is_paused: is_paused, decimals: decimals, gft_contract_owner: gft_contract_owner, current_network: network_name, current_account: current_account, accounts: accounts, stbl_contract: stbl_instance, gft_contract: gft_instance}, this.setEventMonitors);
      await this.updateState();

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  changeAccount = async (accounts) => {
    const {web3}  = this.state;
    console.log("Account change detected :" + accounts);
    const new_account = await web3.utils.toChecksumAddress(window.ethereum.selectedAddress);
    this.setState({current_account: new_account});
    this.updateState();
  };

  changeNetwork = async (accounts) => {
    console.log("Network change detected :" + accounts);
    const id = await window.ethereum.networkVersion ;
    const network = {'1': 'Main Net', '2': 'Morden', '3': 'Ropsten', '4': 'Rinkeby', '42': 'Kovan'}
    let new_net;
    if (network[id] !== undefined) {
      new_net = network[id];
    } else {
      new_net = "Custom network, id: " + id;
    }
    const {stbl_contract} = this.state;
    const new_decimals = (await stbl_contract.decimals());
    this.setState({decimals: new_decimals, current_network: new_net});
    this.updateState();
  };

  setEventMonitors = async () => {
    window.ethereum.on('accountsChanged', this.changeAccount);
    window.ethereum.on('networkChanged', this.changeNetwork);
  };

  updateState = async () =>{
    const { is_paused, is_shop, decimals, web3, stbl_total_supply, stble_my_supply, gft_stbl_balance, gft_total_supply, gft_my_supply, gft_contract_owner, current_account, stbl_contract, gft_contract}  = this.state;
    console.log('updateState->current_account (before): ' + current_account);
    console.log('updateState->is_shop (before): ' + current_account);
    var BN = web3.utils.BN;
    const d = new BN(10).pow(new BN(decimals));
    const new_stbl_total_supply = ((await stbl_contract.totalSupply()).div(d)).toNumber();
    const new_stble_my_supply =   ((await stbl_contract.balanceOf(current_account)).div(d)).toNumber();
    const new_gft_total_supply =  (await gft_contract.totalSupply()).toNumber();
    const new_gft_my_supply =     (await gft_contract.balanceOf(current_account)).toNumber();
    const new_gft_stbl_balance =  ((await stbl_contract.balanceOf(gft_contract.address)).div(d)).toNumber();
    const new_is_paused = (await gft_contract.paused())
    console.log('updateState->Paused state is: ' + new_is_paused)
    var new_is_shop;
    //owner automaticallly has the ShopRole but should not be seen as a shop
    if (gft_contract_owner !== current_account) {
       new_is_shop = await gft_contract.isShop(current_account);
      console.log('updateState->new_is_shop: ' + new_is_shop);
    } else {
      new_is_shop = false;
      console.log('updateState->new_is_shop: set to false becaus is Owner');
    }

    //only update if there is a state change
    if (new_stbl_total_supply !== stbl_total_supply || new_stble_my_supply !== stble_my_supply || new_gft_total_supply !== gft_total_supply || new_gft_my_supply !== gft_my_supply || new_gft_stbl_balance !== gft_stbl_balance || new_is_shop !==is_shop  ||is_paused !== new_is_paused) {
      this.setState({is_paused: new_is_paused, is_shop: new_is_shop, stbl_total_supply: new_stbl_total_supply, stble_my_supply: new_stble_my_supply, gft_stbl_balance: new_gft_stbl_balance, gft_total_supply: new_gft_total_supply, gft_my_supply: new_gft_my_supply});
    }
  }

  get_stbl = async (event) =>{
    event.preventDefault();
    if (this.refs.stbl_amount.value !== '') {
      //const { stbl_total_supply,stble_my_supply, gft_total_supply, gft_my_supply, current_account, stbl_contract, gft_contract}  = this.state;
      const {decimals, current_account, stbl_contract}  = this.state;
      await stbl_contract.mint(current_account, parseInt(this.refs.stbl_amount.value * (10**decimals)), { from: current_account });
      console.log('get_stbl: ' + current_account);
      this.updateState();
    } else {
      alert('Please specify an amount of STBL tokens you want to receive.')
    }
  }

  fund_gft = async (event) =>{
    event.preventDefault();
    if (this.refs.fund_amount.value !== '') {
      //const { stbl_total_supply,stble_my_supply, gft_total_supply, gft_my_supply, current_account, stbl_contract, gft_contract}  = this.state;
      const {decimals, current_account, stbl_contract, gft_contract}  = this.state;
      await stbl_contract.approve(gft_contract.address, parseInt(this.refs.fund_amount.value) * (10**decimals), { from: current_account });
      await gft_contract.fund(parseInt(this.refs.fund_amount.value * (10**decimals)), { from: current_account });
      this.updateState();
    } else {
      alert('Please specify an amount of STBL tokens to fund the GFT contract with.')
    }
  }

  refund_gft = async (event) =>{
    event.preventDefault();
      const {decimals, current_account, stbl_contract, gft_contract}  = this.state;
      await gft_contract.refund({from: current_account});
      this.updateState();
  }

  get_gft = async (event) =>{
    event.preventDefault();
    if (this.refs.gft_stbl_amount.value !== '') {
      //const { stbl_total_supply,stble_my_supply, gft_total_supply, gft_my_supply, current_account, stbl_contract, gft_contract}  = this.state;
      const { decimals, current_account, stbl_contract, gft_contract}  = this.state;
      await stbl_contract.approve(gft_contract.address, parseInt(this.refs.gft_stbl_amount.value * (10**decimals)), { from: current_account });
      const tx = await gft_contract.issue(parseInt(this.refs.gft_stbl_amount.value * (10**decimals)), { from: current_account });
      console.log(tx);
      this.updateState();
    } else {
    alert('Please specify an amount of STBL tokens to buy the GFT (10% will be added by the owner/promotor).')
    }
  }

  send_gft = async (event) =>{
    event.preventDefault();
    if (this.refs.shop_address.value !== '') {
      let tx;
      const {web3, current_account, gft_contract}  = this.state;
      //const count = await gft_contract.balanceOf(current_account);
      let ID = await gft_contract.tokenByIndex(0);
      ID = await gft_contract.tokenOfOwnerByIndex(current_account, 0);
      //const approved = await gft_contract.getApproved(ID);
      //alert('Approved: ' + approved + ' Current Account addess: ' + current_account.address) ;
      //web3.utils.toChecksumAddress(
      console.log('approve: ');
      tx = await gft_contract.approve(web3.utils.toChecksumAddress(this.refs.shop_address.value), ID, { from: current_account });
      console.log(tx);
      console.log('TransactionsafeTransferFrom: ');
      tx = await gft_contract.safeTransferFrom(current_account, web3.utils.toChecksumAddress(this.refs.shop_address.value), ID, { from: current_account });
      console.log(tx);
      this.updateState();
    } else {
    alert('Please specify an amount of STBL tokens to buy the GFT (10% will be added by the owner/promotor).')
    }
  }

  redeem_gft = async (event) =>{
    event.preventDefault();
    let tx;
    const {is_paused, current_account, gft_contract}  = this.state;
    const count = await gft_contract.balanceOf(current_account);
    if (count>0){
      const ID = await gft_contract.tokenOfOwnerByIndex(current_account, 0);
      //const approved = await gft_contract.getApproved(ID);
      //alert('Approved: ' + approved + ' Current Account addess: ' + current_account.address) ;
      //web3.utils.toChecksumAddress(
      if (is_paused){
        console.log('redeemPaused: ');
        tx = await gft_contract.redeemPaused( ID, { from: current_account });
      } else {
        console.log('redeem: ');
        tx = await gft_contract.redeem( ID, { from: current_account });
      }
      console.log(tx);
      this.updateState();
    } else {
      alert("Sorry, you don't have any GFT")
    }
  }

  pause = async (event) =>{
    event.preventDefault();
    const {current_account, gft_contract}  = this.state;
    console.log('pause: ')
    const tx = await gft_contract.pause({from: current_account});
    console.log(tx);
    this.updateState();
  }

  add_shop = async (event) =>{
    if (this.refs.shop_address_add.value !== '') {
      event.preventDefault();
      const {current_account, gft_contract}  = this.state;
      console.log('add_shop: ')
      const tx = await gft_contract.addShop(this.refs.shop_address_add.value, {from: current_account});
      console.log(tx);
      this.updateState();
    } else {

    }
  }

  renounce_shop = async (event) =>{
    event.preventDefault();
    const {current_account, gft_contract}  = this.state;
    console.log('renounce_shop: ');
    const tx = await gft_contract.renounceShop({from: current_account});
    console.log(tx);
    this.updateState();
  }


  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    if (this.state.gft_contract_owner === this.state.current_account) {
      return (
        <div className="App">
          <h1>Owner</h1>
          { this.state.is_paused && <div> <h2>GFT contract is PAUSED.</h2> When all GFT tokens are redeemed you can withdraw the remaining STBL tokens<br/><br/></div> }
          <h2>Manage GiftCertificate contract.</h2>
          <div>Network: {this.state.current_network}</div>
          <div>GFT contract owner: {this.state.gft_contract_owner}</div>
          <div>Your Account: {this.state.current_account}</div>
          <div>Total supply of STBL tokens: {this.state.stbl_total_supply}</div>
          <div>Your supply of STBL tokens: {this.state.stble_my_supply}</div>
          <div>Total supply of GFT tokens: {this.state.gft_total_supply}</div>
          <div>Your supply of GFT tokens: {this.state.gft_my_supply}</div>
          <div>GFT contract's STBL balance (ie. funds): {this.state.gft_stbl_balance}</div>
          <p></p>
          <div><form onSubmit={this.get_stbl}>
            <label>Get STBL tokens (they're free, only for this demo). Amount:
              <input type="text" name="stbl_amount" ref="stbl_amount"/>
            </label>
             <input type="submit" value="Receive" />
          </form></div>
          <p></p>
          <div><form onSubmit={this.fund_gft}>
            <label>Fund the GFT contract. Amount:
              <input type="text" name="stbl_amount" ref="fund_amount"/>
            </label>
             <input type="submit" value="Fund" />
          </form>
          <p></p>
          <div><form onSubmit={this.pause}>
            <label>Pause the GFT contract (kill switch)
            </label>
             <input type="submit" value="Pause" />
          </form></div>
          </div>
          <p></p>
          <div><form onSubmit={this.add_shop}>
              <label>Add shop with address
                <input type="text" name="shop_address_add" ref="shop_address_add"/>
              </label>
              <input type="submit" value="Add" />
             </form>
             <p></p>
          </div>
          { (this.state.is_paused && (this.state.gft_total_supply === 0)) &&
            <div>
              <form onSubmit={this.refund_gft}>
                <label>Refund the remaining STBL tokens from the GFT contract</label>
                <input type="submit" value="Refund" />
              </form>
            </div> }
        </div>
      );
    }

    return (
      <div className="App">
        <h1>User</h1>
        { this.state.is_paused && <div> <h2>GFT contract is PAUSED.</h2> When all GFT tokens are redeemed you can withdraw the remaining STBL tokens<br/><br/></div> }
        <h2>GiftCertificate contract state</h2>
        <div>Network: {this.state.current_network}</div>
        <div>GFT contract owner: {this.state.gft_contract_owner}</div>
        <div>GFT contract paused: {this.state.is_paused}</div>
        <div>Your Account: {this.state.current_account}</div>
        <div>Total supply of STBL tokens: {this.state.stbl_total_supply}</div>
        <div>Your supply of STBL tokens: {this.state.stble_my_supply}</div>
        <div>Total supply of GFT tokens: {this.state.gft_total_supply}</div>
        <div>Your supply of GFT tokens: {this.state.gft_my_supply}</div>
        <div>GFT contract's STBL balance (ie. funds): {this.state.gft_stbl_balance}</div>
        <p></p><div><form onSubmit={this.get_stbl}>
          <label>Get STBL tokens (they're free, only for this demo).
          Amount:
            <input type="text" name="stbl_amount" ref="stbl_amount"/>
          </label>
           <input type="submit" value="Receive" />
        </form></div>
        <p></p>
        <div><form onSubmit={this.get_gft}>
          <label>Buy a GFT with STBL. Amount (10% will be added by the owner/promotor):
            <input type="text" name="gft_stbl_amount" ref="gft_stbl_amount"/>
          </label>
           <input type="submit" value="Buy" />
        </form></div>
        <p></p>
        <div>
          <form onSubmit={this.send_gft}>
            <label>Send (first) GFT to :
              <input type="text" name="shop_address" ref="shop_address"/>
            </label>
            <input type="submit" value="Send" />
          </form>
          <p></p>
        </div>

        { ((this.state.is_paused ||this.state.is_shop) && (this.state.gft_my_supply > 0)) &&
          <div>
            <form onSubmit={this.redeem_gft}>
              <label>redeem (first) GFT</label>
              <input type="submit" value="Redeem" />
            </form>
            <p></p>
          </div> }
        { this.state.is_shop &&
          <div><form onSubmit={this.renounce_shop}>
            <label>Renounce your ability to redeem as a shop
            </label>
            <input type="submit" value="Renounce" />
          </form></div>
        }

      </div>
    );
  }
}

export default App;
