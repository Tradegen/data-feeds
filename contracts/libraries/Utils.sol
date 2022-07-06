// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

library Utils {
    /**
    * @notice Calculates the scalar for updating portfolio value.
    * @dev Scalar has 18 decimals.
    * @param _positiveCurrentValue The sum of [(% change) * 1e18 / 100] for profitable positions.
    * @param _negativeCurrentValue The sum of [(% change) * 1e18 / 100] for unprofitable positions.
    * @param _valueRemoved Value of the position removed.
    * @param _isPositive Whether the removed value is positive.
    * @return uint256 The scalar for updating portfolio value.
    */
    function calculateScalar(uint256 _positiveCurrentValue, uint256 _negativeCurrentValue, uint256 _valueRemoved, bool _isPositive) public pure returns (uint256) {
        (uint256 case1, uint256 c0) = calculateCase(_positiveCurrentValue, _negativeCurrentValue);        
        uint256 newPositiveCurrentValue = _isPositive ? _positiveCurrentValue - _valueRemoved : _positiveCurrentValue;
        uint256 newNeativeCurrentValue = !_isPositive ? _negativeCurrentValue - _valueRemoved : _negativeCurrentValue;
        (uint256 case2, uint256 c1) = calculateCase(newPositiveCurrentValue, newNeativeCurrentValue);

        // >=0% gain -> >= 0% gain.
        if (case1 == 1 && case2 == 1) {
            return (c0 + 1e18) * 1e18 / (c1 + 1e18);
        }
        // >=0% gain -> <100% loss.
        else if (case1 == 1 && case2 == 2) {
            return (c0 + 1e18) * 1e18 / (1e18 - (80 * c1 / 100));
        }
        // >=0% gain -> 100% loss.
        else if (case1 == 1 && case2 == 3) {
            return 5 * (c0 + 1e18);
        }
        // >=0% gain -> >100% loss.
        else if (case1 == 1 && case2 == 4) {
            return 5 * (c0 + 1e18) * c1 / 1e18;
        }
        // <100% loss -> >=0% gain.
        else if (case1 == 2 && case2 == 1) {
            return (1e18 - (80 * c0 / 100)) * 1e18 / (c1 + 1e18);
        }
        // <100% loss -> <100% loss.
        else if (case1 == 2 && case2 == 2) {
            return (1e18 - (80 * c0 / 100)) * 1e18 / (1e18 - (80 * c1 / 100));
        }
        // <100% loss -> 100% loss.
        else if (case1 == 2 && case2 == 3) {
            return 5 * (1e18 - (80 * c0 / 100));
        }
        // <100% loss -> >100% loss.
        else if (case1 == 2 && case2 == 4) {
            return 5 * c1 * (1e18 - (80 * c0 / 100)) / 1e18;
        }
        // 100% loss -> >=0% gain.
        else if (case1 == 3 && case2 == 1) {
            return 20 * 1e36 / (c1 + 1e18) / 100;
        }
        // 100% loss -> <100% loss.
        else if (case1 == 3 && case2 == 2) {
            return 20 * 1e36 / 100 / (1e18 - (80 * c1 / 100));
        }
        // 100% loss -> 100% loss.
        else if (case1 == 3 && case2 == 3) {
            return 1e18;
        }
        // 100% loss -> >100% loss.
        else if (case1 == 3 && case2 == 4) {
            return c1;
        }
        // >100% loss -> >=0% gain.
        else if (case1 == 4 && case2 == 1) {
            return 20 * 1e54 / 100 / c0 / (c1 + 1e18);
        }
        // >100% loss -> <100% loss.
        else if (case1 == 4 && case2 == 2) {
            return 20 * 1e54 / 100 / c0 / (1e18 - (80 * c1 / 100));
        }
        // >100% loss -> 100% loss.
        else if (case1 == 4 && case2 == 3) {
            return 1e36 / c0;
        }
        // >100% loss -> >100% loss.
        else if (case1 == 4 && case2 == 4) {
            return c1 * 1e18 / c0;
        }

        return 0;
    }

    /**
    * @notice Calculates the case number based on the net current value, and returns the net current value.
    * @dev Case 1 => >=0% gain.
    * @dev Case 2 => <100% loss.
    * @dev Case 3 => 100% loss.
    * @dev Case 4 => >100% loss.
    * @param _positiveCurrentValue The sum of [(% change) * 1e18 / 100] for profitable positions.
    * @param _negativeCurrentValue The sum of [(% change) * 1e18 / 100] for unprofitable positions.
    * @return (uint256, uint256) The case number and the net current value.
    */
    function calculateCase(uint256 _positiveCurrentValue, uint256 _negativeCurrentValue) public pure returns (uint256, uint256) {
        // Case 1.
        if (_positiveCurrentValue >= _negativeCurrentValue) {
            return (1, _positiveCurrentValue - _negativeCurrentValue);
        }
        // Case 2.
        else if (_negativeCurrentValue - _positiveCurrentValue > 0 && _negativeCurrentValue -_positiveCurrentValue < 1e18) {
            return (2, _negativeCurrentValue - _positiveCurrentValue);
        }
        // Case 3.
        else if (_negativeCurrentValue - _positiveCurrentValue == 1e18) {
            return (3, _negativeCurrentValue - _positiveCurrentValue);
        }
        // Case 4.
        else if (_negativeCurrentValue - _positiveCurrentValue > 1e18) {
            return (4, _negativeCurrentValue - _positiveCurrentValue);
        }

        return (0, 0);
    }
}