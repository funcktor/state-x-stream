import { BehaviorSubject } from 'rxjs';
interface Conf {
    readonly props$: BehaviorSubject<any>;
    readonly onDestroy: {
        (callback: {
            (): void;
        }): void;
    };
    readonly resolve: {
        (streamDict: any): void;
    };
    readonly setIntercept: {
        (streamDict: any): void;
    };
}
/**
 * Divide two numbers.
 *
 * @since 4.7.0
 * @category Math
 * @param {number} dividend The first number in a division.
 * @param {number} divisor The second number in a division.
 * @returns {number} Returns the quotient.
 * @example
 *
 * divide(6, 4)
 * // => 1.5
 */
declare function rx(controller: {
    (conf: Conf): void;
}): (Wrapped: any) => {
    (): void;
    prototype: any;
};
export default rx;
