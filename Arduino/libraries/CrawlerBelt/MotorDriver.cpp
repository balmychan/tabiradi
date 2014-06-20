#include <MotorDriver.h>

MotorDriver::MotorDriver(){
}

void MotorDriver::create(uint8_t motor_driver_shingou_1, uint8_t motor_driver_shingou_2, uint8_t motor_driver_pwm) {
  _motor_driver_shingou_1 = motor_driver_shingou_1;
  _motor_driver_shingou_2 = motor_driver_shingou_2;
  _motor_driver_pwm = motor_driver_pwm;
  pinMode(_motor_driver_shingou_1,OUTPUT);
  pinMode(_motor_driver_shingou_2,OUTPUT);
}


void MotorDriver::forward(uint8_t sd) {
	analogWrite(_motor_driver_pwm, sd);
	digitalWrite(_motor_driver_shingou_1, HIGH);
	digitalWrite(_motor_driver_shingou_2, LOW);
}

void MotorDriver::reverse(uint8_t sd) {
	analogWrite(_motor_driver_pwm, sd);
	digitalWrite(_motor_driver_shingou_1, LOW);
	digitalWrite(_motor_driver_shingou_2, HIGH);
}

void MotorDriver::stop() {
	digitalWrite(_motor_driver_shingou_1, LOW);
	digitalWrite(_motor_driver_shingou_2, LOW);
}

