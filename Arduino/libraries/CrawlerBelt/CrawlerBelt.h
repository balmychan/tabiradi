#include <MotorDriver.h>
#include <Arduino.h>

class CrawlerBelt {
 private:
  MotorDriver _left_motor;
  MotorDriver _right_motor;

 public:
  CrawlerBelt();
  void create(uint8_t left_motor_driver_shingou_1, uint8_t left_motor_driver_shingou_2, uint8_t left_motor_driver_pwm,
  uint8_t right_motor_driver_shingou_1, uint8_t right_motor_driver_shingou_2, uint8_t right_motor_driver_pwm);
  void stop();
  void forward(uint8_t sp);
  void back(uint8_t sp);
  void turn_right(uint8_t sp);
  void turn_left(uint8_t sp);
  
};