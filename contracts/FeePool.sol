// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Inheritance.
import './interfaces/IFeePool.sol';

// OpenZeppelin.
import './openzeppelin-solidity/contracts/SafeMath.sol';
import './openzeppelin-solidity/contracts/ERC20/SafeERC20.sol';
import './openzeppelin-solidity/contracts/Ownable.sol';
import './openzeppelin-solidity/contracts/ReentrancyGuard.sol';

contract FeePool is IFeePool, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public immutable feeToken;
    address public operator;

    mapping (address => uint256) public override availableFees;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _operator, address _feeToken) Ownable() {
        operator = _operator;
        feeToken = IERC20(_feeToken);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Adds fees to the given account.
    * @dev Assumes that this contract has allowance for fee token when transfering token.
    * @param _account Address of the user to add fees to.
    * @param _amount Amount of fee tokens to transfer.
    */
    function addFees(address _account, uint256 _amount) external override nonReentrant {
        availableFees[_account] = availableFees[_account].add(_amount);

        feeToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit AddedFees(_account, _amount);
    }

    /**
    * @notice Claims all available fees for msg.sender.
    */
    function claimFees() external override nonReentrant {
        uint256 amount = availableFees[msg.sender];
        availableFees[msg.sender] = 0;

        feeToken.safeTransfer(msg.sender, amount);

        emit ClaimedFees(msg.sender, amount);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Sets the address of the operator.
    * @dev Only the contract owner can call this function.
    * @param _newOperator Address of the new fee operator.
    */
    function setOperator(address _newOperator) external onlyOwner {
        require(_newOperator != address(0), "FeePool: Invalid address for _newOperator.");

        operator = _newOperator;

        emit SetOperator(_newOperator);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOperator() {
        require(msg.sender == operator, "FeePool: Only the operator can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event ClaimedFees(address user, uint256 amount);
    event AddedFees(address user, uint256 amount);
    event SetOperator(address _newOperator);
}