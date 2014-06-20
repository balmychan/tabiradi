#include <Arduino.h>

class MotorDriver {
 private:
  //モータードライバ  信号用端子
  uint8_t _motor_driver_shingou_1;
  uint8_t _motor_driver_shingou_2;
  //モータードライバ  PWM
  uint8_t _motor_driver_pwm;

 public:
  MotorDriver();
  void create(uint8_t motor_driver_shingou_1, uint8_t motor_driver_shingou_2, uint8_t motor_driver_pwm);
  void forward(uint8_t sd);
  void reverse(uint8_t sd);
  void stop();

};
