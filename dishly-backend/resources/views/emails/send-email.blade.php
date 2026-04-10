<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dishly</title>
</head>
<body style="margin: 0; padding: 20px 12px; background: #ffffff; font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; border-collapse: collapse;">
        <tr>
            <td style="padding: 0 0 18px; text-align: center;">
                <span style="display: inline-block; padding: 8px 14px; background: #fd8923; border-radius: 999px; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.04em;">
                    Dishly
                </span>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 0 16px; font-size: 24px; font-weight: 700; color: #111827;">
                Hello{{ !empty($recipientName) ? ', ' . $recipientName : '' }}.
            </td>
        </tr>
        <tr>
            <td style="padding: 0 0 16px; font-size: 16px; color: #374151;">
                {!! nl2br(e($messageBody)) !!}
            </td>
        </tr>

        @if (!empty($recoveryCode))
            <tr>
                <td style="padding: 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #9a3412;">Your recovery code is:</p>
                    <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #c2410c;">{{ $recoveryCode }}</p>
                </td>
            </tr>
            <tr><td style="height: 16px;"></td></tr>
        @endif

        @if (!empty($actionUrl))
            <tr>
                <td style="padding: 8px 0 16px; text-align: center;">
                    <a href="{{ $actionUrl }}" style="display: inline-block; padding: 12px 20px; background: #fd8923; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        {{ $actionText ?? 'Open link' }}
                    </a>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 16px; font-size: 13px; color: #6b7280;">
                    If the button does not work, use this link:<br>
                    <a href="{{ $actionUrl }}" style="color: #ea580c; word-break: break-all;">{{ $actionUrl }}</a>
                </td>
            </tr>
        @endif

        <tr>
            <td style="padding: 8px 0 12px; font-size: 14px; color: #4b5563;">
                If you did not request this action, you can safely ignore this email.
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: #111827;">
                Best regards,<br>
                <strong>The Dishly Team</strong>
            </td>
        </tr>
    </table>
</body>
</html>
