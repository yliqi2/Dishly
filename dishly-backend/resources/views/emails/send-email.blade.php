<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dishly</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
    <h2>Hello{{ !empty($recipientName) ? ', ' . $recipientName : '' }}.</h2>

    <p>{!! nl2br(e($messageBody)) !!}</p>

    @if (!empty($recoveryCode))
        <p>Your recovery code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">{{ $recoveryCode }}</p>
    @endif

    @if (!empty($actionUrl))
        <p style="margin: 24px 0;">
            <a href="{{ $actionUrl }}" style="display: inline-block; padding: 12px 20px; background: #fd8923; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
                {{ $actionText ?? 'Open link' }}
            </a>
        </p>
        <p style="font-size: 14px; color: #64748b;">If the button does not work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; word-break: break-all;"><a href="{{ $actionUrl }}">{{ $actionUrl }}</a></p>
    @endif

    <p>If you did not request this action, you can safely ignore this email.</p>

    <p>
        Best regards,<br>
        The Dishly Team
    </p>
</body>
</html>
