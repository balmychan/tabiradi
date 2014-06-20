#include <CrawlerBelt.h>

CrawlerBelt::CrawlerBelt(){
}

void CrawlerBelt::create(uint8_t left_motor_driver_shingou_1, uint8_t left_motor_driver_shingou_2, uint8_t left_motor_driver_pwm,
  uint8_t right_motor_driver_shingou_1, uint8_t right_motor_driver_shingou_2, uint8_t right_motor_driver_pwm) {
  _left_motor.create(left_motor_driver_shingou_1, left_motor_driver_shingou_2, left_motor_driver_pwm);
  _right_motor.create(right_motor_driver_shingou_1, right_motor_driver_shingou_2, right_motor_driver_pwm);
}

void CrawlerBelt::stop(){
  _left_motor.stop();
  _right_motor.stop();
}

void CrawlerBelt::forward(uint8_t sp){
  _left_motor.forward(sp);
  _right_motor.forward(sp);
}

void CrawlerBelt::back(uint8_t sp){
  _left_motor.reverse(sp);
  _right_motor.reverse(sp);
}

void CrawlerBelt::turn_right(uint8_t sp){
  _left_motor.forward(sp);
  _right_motor.reverse(sp);
}

void CrawlerBelt::turn_left(uint8_t sp){
  _left_motor.reverse(sp);
  _right_motor.forward(sp);
}


