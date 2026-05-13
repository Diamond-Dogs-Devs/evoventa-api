import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpCustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const error = exception.getResponse();

      return response.status(status).json(error);
    }

    if (
      exception?.message &&
      exception.message.toString().includes('Empty response')
    ) {
      return response.status(500).json({
        status: 500,
        message: exception.message
          .toString()
          .substring(0, exception.message.toString().indexOf('(') - 1),
      });
    }

    if (
      typeof exception === 'object' &&
      'status' in exception &&
      'message' in exception
    ) {
      const status = isNaN(+exception.status)
        ? HttpStatus.BAD_REQUEST
        : +exception.status;

      return response.status(status).json(exception);
    }

    return response.status(500).json({
      status: 500,
      message: exception?.message || 'Internal server error',
    });
  }
}
