$.ready(function(error) {
    var gyro = $('#gyro');
    var motor = $('#dcmotor');
    var enc = $('#encoder');

    var getBalancePwm = function (actualAngle, actualGyro) {
        var targetAngle = 0.8;
        var kP = 80;
        var kD = 2;

        var balancePwm = kP * (actualAngle - targetAngle) + kD * actualGyro;
        return balancePwm / 1000;
    };

    var encoder = 0;
    var sumEncoder = 0;
    var getVelocityPwm = function (actualLEncoder, actualREncoder) {
        var targetVelocity = 0;
        var kP = 3;
        var kI = kP / 200;

        encoder = 0.2 * (actualLEncoder + actualREncoder - targetVelocity) + 0.8 * encoder;
        sumEncoder += encoder;

        if (sumEncoder >= 3000) {
            sumEncoder = 3000;
        }
        if (sumEncoder <= -3000) {
            sumEncoder = -3000;
        }

        var velocityPwm = kP * encoder + kI * sumEncoder;
        return (velocityPwm / 1000);
    };

    var cycle = 20;
    var gyroAcquire, encAcquire, balanceControl;

    var angleX = 0;
    var gyroY = 0;
    var rpm = 0;

    gyroAcquire = setInterval(function() {
        gyro.getFusedMotionX(cycle, function (error, _angleX, _gyroY) {
            angleX = _angleX;
            gyroY = _gyroY;
        });
    }, cycle);

    encAcquire = setInterval(function() {
        enc.getRpm(function (error, _rpm) {
            rpm = _rpm;
        });
    }, cycle);

    balanceControl = setInterval(function() {
        var balancePwm = getBalancePwm(angleX, gyroY);
        var velocityPwm = getVelocityPwm(rpm, rpm);
        var pwmDuty = balancePwm - velocityPwm;

        if (pwmDuty >= 0) {
            if (pwmDuty >= 1) {
                pwmDuty = 1;
            }
            motor.forwardRotateB(pwmDuty);
            motor.backwardRotateA(pwmDuty);
        } else {
            if (pwmDuty <= -1) {
                pwmDuty = -1;
            }
            motor.backwardRotateB(-pwmDuty);
            motor.forwardRotateA(-pwmDuty);
        }

        if (angleX >= 30 || angleX <= -30) {
            stopWorld();
        }
    }, cycle);

    $('#button-1').on('push', function() {
        stopWorld();
    });
    $('#button-2').on('push', function() {
        stopWorld();
    });

    var stopWorld = function() {
        clearInterval(gyroAcquire);
        clearInterval(encAcquire);
        clearInterval(balanceControl);
        motor.stopRotateA();
        motor.stopRotateB();
    };
});
